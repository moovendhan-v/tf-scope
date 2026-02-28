import * as vscode from 'vscode';
import { TerraformScanner } from '../parsers/TerraformScanner';
import { getHtmlShell } from './webviewUtils';

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private scanner: TerraformScanner
  ) {
    this._panel = panel;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'openFile':
          await vscode.commands.executeCommand('tf-scope.openFile', message.filePath);
          break;
        case 'refresh':
          await vscode.commands.executeCommand('tf-scope.refreshFiles');
          break;
        case 'openInEditor': {
          const doc = await vscode.workspace.openTextDocument(message.filePath);
          await vscode.window.showTextDocument(doc);
          break;
        }
        case 'copyText':
          await vscode.env.clipboard.writeText(message.text);
          vscode.window.showInformationMessage('Copied to clipboard!');
          break;
      }
    }, null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, scanner: TerraformScanner) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel._panel.reveal(column);
      DashboardPanel.currentPanel._update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'tf-scopeDashboard',
      'tf-scope',
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')],
        retainContextWhenHidden: true,
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, scanner);
  }

  public static refresh() {
    DashboardPanel.currentPanel?._update();
  }

  private _update() {
    const files = this.scanner.getFiles();
    this._panel.title = `tf-scope — ${files.length} file${files.length !== 1 ? 's' : ''}`;
    this._panel.webview.html = getHtmlShell(
      this._panel.webview,
      this.extensionUri,
      'tf-scope Dashboard',
      // Bootstrap: give React the file list and tell it to show the dashboard
      `window.__tf_scope_FILES__ = ${JSON.stringify(files)};
window.__tf_scope_VIEW__ = 'dashboard';
window.__vscode__ = acquireVsCodeApi();`
    );
  }

  public dispose() {
    DashboardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      this._disposables.pop()?.dispose();
    }
  }
}
