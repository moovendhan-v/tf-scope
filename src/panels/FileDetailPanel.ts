import * as vscode from 'vscode';
import { TerraformScanner } from '../parsers/TerraformScanner';
import { getWebviewUri, getNonce } from './webviewUtils';

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
        case 'openInEditor':
          const doc = await vscode.workspace.openTextDocument(message.filePath || this.filePath);
          await vscode.window.showTextDocument(doc);
          break;
        case 'copyText':
          await vscode.env.clipboard.writeText(message.text);
          vscode.window.showInformationMessage('Copied to clipboard!');
          break;
      }
    }, null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, filePath: string, scanner: TerraformScanner) {
    const existing = FileDetailPanel.panels.get(filePath);
    if (existing) {
      existing._panel.reveal(vscode.ViewColumn.Active);
      existing._update();
      return;
    }

    const fileName = filePath.split(/[/\\]/).pop() || filePath;
    const panel = vscode.window.createWebviewPanel(
      'TFScopeFileDetail',
      `TFScope: ${fileName}`,
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
      this._panel.webview.html = `<html><body style="background:#080b0f;color:#7a8899;font-family:monospace;padding:40px">
        <h2 style="color:#ff6b6b">File not found or not yet parsed</h2>
        <p>Path: ${this.filePath}</p>
        <p>Try refreshing: <a href="#" onclick="acquireVsCodeApi().postMessage({command:'refresh'})">Refresh</a></p>
      </body></html>`;
      return;
    }

    const fileName = this.filePath.split(/[/\\]/).pop() || this.filePath;
    this._panel.title = `TFScope: ${fileName}`;
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, file);
  }

  private _getHtmlForWebview(webview: vscode.Webview, file: any) {
    const nonce = getNonce();
    const scriptUri = getWebviewUri(webview, this.extensionUri, 'webview-ui', 'dist', 'assets', 'index.js');
    const styleUri = getWebviewUri(webview, this.extensionUri, 'webview-ui', 'dist', 'assets', 'index.css');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com; font-src ${webview.cspSource} https://fonts.gstatic.com; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
  <title>TFScope: ${file.name}</title>
  <link rel="stylesheet" href="${styleUri}">
  <style>
    :root {
      --bg:#080b0f;--bg2:#0d1117;--bg3:#131920;--bg4:#181f28;--bg5:#1e2733;
      --border:#1c2530;--border2:#243040;--text:#dde6f0;--text2:#7a8899;--text3:#3d4f60;
      --green:#00e090;--green2:#00b872;--green-dim:rgba(0,224,144,0.1);
      --amber:#f5a623;--amber-dim:rgba(245,166,35,0.12);
      --purple:#9b8fff;--red:#ff6b6b;--red-dim:rgba(255,107,107,0.12);
      --blue:#4db8ff;--cyan:#00d4e8;--r:10px;--rl:14px;
    }
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'JetBrains Mono',monospace;background:var(--bg);color:var(--text);min-height:100vh;}
    #root{min-height:100vh;}
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__TFSCOPE_FILES__ = [${JSON.stringify(file)}];
    window.__TFSCOPE_CURRENT_FILE__ = ${JSON.stringify(file)};
    window.__TFSCOPE_VIEW__ = 'fileDetail';
    const vscode = acquireVsCodeApi();
    window.__vscode__ = vscode;
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    FileDetailPanel.panels.delete(this.filePath);
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) { d.dispose(); }
    }
  }
}
