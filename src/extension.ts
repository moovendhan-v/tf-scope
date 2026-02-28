import * as vscode from 'vscode';
import { TFScopeFileProvider } from './providers/TFScopeFileProvider';
import { DashboardPanel } from './panels/DashboardPanel';
import { FileDetailPanel } from './panels/FileDetailPanel';
import { TerraformScanner } from './parsers/TerraformScanner';

let fileProvider: TFScopeFileProvider;
let scanner: TerraformScanner;

export function activate(context: vscode.ExtensionContext) {
  console.log('TFScope is now active');

  scanner = new TerraformScanner();
  fileProvider = new TFScopeFileProvider(scanner);

  // Register tree view
  const treeView = vscode.window.createTreeView('tf-scope.fileExplorer', {
    treeDataProvider: fileProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(treeView);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('tf-scope.openDashboard', () => {
      DashboardPanel.createOrShow(context.extensionUri, scanner);
    }),

    vscode.commands.registerCommand('tf-scope.refreshFiles', async () => {
      await scanner.scan();
      fileProvider.refresh();
      DashboardPanel.refresh();
      vscode.window.showInformationMessage(`TFScope: Found ${scanner.getFiles().length} Terraform files`);
    }),

    vscode.commands.registerCommand('tf-scope.openFile', async (filePathOrItem: any) => {
      let filePath: string;
      if (typeof filePathOrItem === 'string') {
        filePath = filePathOrItem;
      } else if (filePathOrItem?.resourceUri) {
        filePath = filePathOrItem.resourceUri.fsPath;
      } else if (filePathOrItem?.filePath) {
        filePath = filePathOrItem.filePath;
      } else {
        const activeFile = vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!activeFile) { return; }
        filePath = activeFile;
      }
      FileDetailPanel.createOrShow(context.extensionUri, filePath, scanner);
    }),

    vscode.commands.registerCommand('tf-scope.scanWorkspace', async () => {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'TFScope: Scanning workspace...',
        cancellable: false,
      }, async () => {
        await scanner.scan();
        fileProvider.refresh();
        DashboardPanel.refresh();
      });
      vscode.window.showInformationMessage(`TFScope: Scan complete — ${scanner.getFiles().length} files found`);
    })
  );

  // Auto-scan on activation
  const config = vscode.workspace.getConfiguration('tf-scope');
  if (config.get('autoScan')) {
    scanner.scan().then(() => {
      fileProvider.refresh();
    });
  }

  // Watch for file changes
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.{tf,tfstate,tfplan,json}');
  watcher.onDidCreate(async () => { await scanner.scan(); fileProvider.refresh(); DashboardPanel.refresh(); });
  watcher.onDidDelete(async () => { await scanner.scan(); fileProvider.refresh(); DashboardPanel.refresh(); });
  watcher.onDidChange(async (uri) => {
    await scanner.rescanFile(uri.fsPath);
    fileProvider.refresh();
    DashboardPanel.refresh();
    FileDetailPanel.refresh(uri.fsPath);
  });
  context.subscriptions.push(watcher);
}

export function deactivate() { }
