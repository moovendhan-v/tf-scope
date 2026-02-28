import * as vscode from 'vscode';
import { TerraformScanner } from '../parsers/TerraformScanner';
import { getHtmlShell } from './webviewUtils';

export class FileDetailPanel {
  public static panels: Map<string, FileDetailPanel> = new Map();
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private filePath: string,
    private scanner: TerraformScanner
  ) {
    this._panel = panel;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'openInEditor': {
          const target = message.filePath ?? this.filePath;
          const doc = await vscode.workspace.openTextDocument(target);
          await vscode.window.showTextDocument(doc);
          break;
        }
        case 'copyText':
          await vscode.env.clipboard.writeText(message.text);
          vscode.window.showInformationMessage('Copied to clipboard!');
          break;
        case 'refresh':
          this._update();
          break;
      }
    }, null, this._disposables);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    filePath: string,
    scanner: TerraformScanner
  ) {
    const existing = FileDetailPanel.panels.get(filePath);
    if (existing) {
      existing._panel.reveal(vscode.ViewColumn.Active);
      existing._update();
      return;
    }

    const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
    const panel = vscode.window.createWebviewPanel(
      'tf-scopeFileDetail',
      `tf-scope: ${fileName}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')],
        retainContextWhenHidden: true,
      }
    );

    const instance = new FileDetailPanel(panel, extensionUri, filePath, scanner);
    FileDetailPanel.panels.set(filePath, instance);
  }

  public static refresh(filePath: string) {
    FileDetailPanel.panels.get(filePath)?._update();
  }

  private _update() {
    const file = this.scanner.getFile(this.filePath);

    if (!file) {
      // File hasn't been parsed yet — show a minimal error page.
      // Still use getHtmlShell so even the error page has correct CSP/fonts.
      this._panel.webview.html = getHtmlShell(
        this._panel.webview,
        this.extensionUri,
        'tf-scope — File not found',
        `window.__tf_scope_FILES__ = [];
window.__tf_scope_VIEW__ = 'dashboard';
window.__vscode__ = acquireVsCodeApi();
// Surface an error the React app can read
window.__tf_scope_ERROR__ = ${JSON.stringify(
          `File not yet parsed: ${this.filePath}. Try refreshing.`
        )};`
      );
      return;
    }

    const fileName = this.filePath.split(/[/\\]/).pop() ?? this.filePath;
    this._panel.title = `tf-scope: ${fileName}`;

    this._panel.webview.html = getHtmlShell(
      this._panel.webview,
      this.extensionUri,
      `tf-scope: ${fileName}`,
      // All files are passed so the React app can navigate between them.
      // __tf_scope_CURRENT_FILE__ tells it which one to open in FileDetailView.
      `window.__tf_scope_FILES__ = ${JSON.stringify(this.scanner.getFiles())};
window.__tf_scope_CURRENT_FILE__ = ${JSON.stringify(file)};
window.__tf_scope_VIEW__ = 'fileDetail';
window.__vscode__ = acquireVsCodeApi();`
    );
  }

  public dispose() {
    FileDetailPanel.panels.delete(this.filePath);
    this._panel.dispose();
    while (this._disposables.length) {
      this._disposables.pop()?.dispose();
    }
  }
}
