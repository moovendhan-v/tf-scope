import * as vscode from 'vscode';
import { TerraformScanner } from '../parsers/TerraformScanner';
import { getWebviewUri, getNonce } from './webviewUtils';

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
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'openFile':
            await vscode.commands.executeCommand('TFScope.openFile', message.filePath);
            break;
          case 'refresh':
            await vscode.commands.executeCommand('TFScope.refreshFiles');
            break;
          case 'openInEditor':
            const doc = await vscode.workspace.openTextDocument(message.filePath);
            await vscode.window.showTextDocument(doc);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri, scanner: TerraformScanner) {
    const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.One;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel._panel.reveal(column);
      DashboardPanel.currentPanel._update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'TFScopeDashboard',
      'TFScope Dashboard',
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
    const webview = this._panel.webview;
    this._panel.title = `TFScope — ${files.length} files`;
    this._panel.webview.html = this._getHtmlForWebview(webview, files);
  }

  private _getHtmlForWebview(webview: vscode.Webview, files: any[]) {
    const nonce = getNonce();

    // Try to load built React app, fallback to inline HTML
    const scriptUri = getWebviewUri(webview, this.extensionUri, 'webview-ui', 'dist', 'assets', 'index.js');
    const styleUri = getWebviewUri(webview, this.extensionUri, 'webview-ui', 'dist', 'assets', 'index.css');
    const filesJson = JSON.stringify(files);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com; font-src ${webview.cspSource} https://fonts.gstatic.com; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
  <title>TFScope</title>
  <link rel="stylesheet" href="${styleUri}">
  <style>
    :root {
      --bg: #080b0f; --bg2: #0d1117; --bg3: #131920; --bg4: #181f28; --bg5: #1e2733;
      --border: #1c2530; --border2: #243040;
      --text: #dde6f0; --text2: #7a8899; --text3: #3d4f60;
      --green: #00e090; --green2: #00b872; --green-dim: rgba(0,224,144,0.1);
      --amber: #f5a623; --amber-dim: rgba(245,166,35,0.12);
      --purple: #9b8fff; --purple-dim: rgba(155,143,255,0.12);
      --red: #ff6b6b; --red-dim: rgba(255,107,107,0.12);
      --blue: #4db8ff; --blue-dim: rgba(77,184,255,0.1);
      --cyan: #00d4e8; --r: 10px; --rl: 14px;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'JetBrains Mono',monospace; background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__TFSCOPE_FILES__ = ${filesJson};
    window.__TFSCOPE_VIEW__ = 'dashboard';
    const vscode = acquireVsCodeApi();
    window.__vscode__ = vscode;
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    DashboardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) { d.dispose(); }
    }
  }
}
