import * as vscode from 'vscode';

// ─── URI helper ──────────────────────────────────────────────────────────────
export function getWebviewUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  ...pathList: string[]
): vscode.Uri {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

// ─── Nonce ───────────────────────────────────────────────────────────────────
export function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

// ─── Shared HTML shell ───────────────────────────────────────────────────────
//
// Every webview panel calls this single function.
// No panel should ever hardcode fonts, CSS variables, or <style> blocks itself —
// those all live here (or better, in the built index.css from Vite/Tailwind).
//
// The `bootstrapScript` parameter is a plain JS string that will be injected
// before the React bundle, e.g. to set window.__tf_scope_FILES__ etc.
//
export function getHtmlShell(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  title: string,
  bootstrapScript: string
): string {
  const nonce = getNonce();

  // Paths to the Vite-built React app
  const scriptUri = getWebviewUri(
    webview, extensionUri, 'webview-ui', 'dist', 'assets', 'index.js'
  );
  const styleUri = getWebviewUri(
    webview, extensionUri, 'webview-ui', 'dist', 'assets', 'index.css'
  );

  // CSP: fonts come from googleapis/gstatic, everything else from the
  // extension's own dist folder. 'unsafe-inline' for style-src covers
  // Tailwind's runtime style injection in dev; in production the built
  // CSS file handles it.
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src ${webview.cspSource} https://fonts.gstatic.com data:`,
    `script-src 'nonce-${nonce}'`,
    `img-src ${webview.cspSource} data: blob:`,
  ].join('; ');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />

  <!--
    Google Fonts — JetBrains Mono (body) + Syne (headings).
    These are also referenced in index.css via @import, but having
    the <link> here lets them start loading before the CSS bundle.
  -->
  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
    crossorigin
  />
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap"
    rel="stylesheet"
  />

  <title>${title}</title>

  <!--
    index.css is the Vite/Tailwind build output.
    It contains all shadcn CSS variables, Tailwind utilities,
    and the tf-scope token definitions.
    DO NOT duplicate any of that here.
  -->
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id="root"></div>

  <!--
    Bootstrap script: sets window globals that the React app reads
    on first render. Must run BEFORE the React bundle.
  -->
  <script nonce="${nonce}">
${bootstrapScript}
  </script>

  <!-- React app bundle (built by Vite) -->
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

