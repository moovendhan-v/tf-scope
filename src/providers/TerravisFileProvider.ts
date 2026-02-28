import * as vscode from 'vscode';
import * as path from 'path';
import { TerraformScanner, TerraformFile } from '../parsers/TerraformScanner';

export class TfScopeFileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath?: string,
    public readonly itemType?: 'group' | 'file' | 'resource',
    public readonly tfFile?: TerraformFile
  ) {
    super(label, collapsibleState);

    if (itemType === 'file' && tfFile) {
      this.description = `${tfFile.resources.length} resources`;
      this.tooltip = tfFile.filePath;
      this.contextValue = 'terravisFile';
      this.resourceUri = vscode.Uri.file(tfFile.filePath);

      const iconMap: Record<string, string> = {
        tf: '$(file-code)',
        tfstate: '$(database)',
        plan: '$(diff)',
      };
      this.iconPath = new vscode.ThemeIcon(
        tfFile.type === 'tf' ? 'file-code' :
          tfFile.type === 'tfstate' ? 'database' : 'diff'
      );

      this.command = {
        command: 'tf-scope.openFile',
        title: 'Open in TerraVis',
        arguments: [tfFile.filePath],
      };
    } else if (itemType === 'group') {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'terravisGroup';
    }
  }
}

export class TfScopeFileProvider implements vscode.TreeDataProvider<TfScopeFileItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TfScopeFileItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private scanner: TerraformScanner) { }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TfScopeFileItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TfScopeFileItem): vscode.ProviderResult<TfScopeFileItem[]> {
    if (!element) {
      return this.getRootItems();
    }
    if (element.itemType === 'group') {
      return this.getGroupFiles(element.label as string);
    }
    return [];
  }

  private getRootItems(): TfScopeFileItem[] {
    const files = this.scanner.getFiles();
    if (files.length === 0) {
      const empty = new TfScopeFileItem(
        'No Terraform files found',
        vscode.TreeItemCollapsibleState.None,
        undefined,
        'group'
      );
      empty.iconPath = new vscode.ThemeIcon('info');
      empty.command = {
        command: 'tf-scope.scanWorkspace',
        title: 'Scan Workspace',
      };
      return [empty];
    }

    const groups = [
      { label: `🟢 .tf Files`, type: 'tf' },
      { label: `💾 State Files`, type: 'tfstate' },
      { label: `📋 Plan Files`, type: 'plan' },
    ];

    const items: TfScopeFileItem[] = [];

    for (const group of groups) {
      const groupFiles = files.filter(f => f.type === group.type);
      if (groupFiles.length > 0) {
        const item = new TfScopeFileItem(
          group.label,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          'group'
        );
        item.description = `${groupFiles.length}`;
        items.push(item);
      }
    }

    return items;
  }

  private getGroupFiles(groupLabel: string): TfScopeFileItem[] {
    const files = this.scanner.getFiles();
    let filtered: TerraformFile[];

    if (groupLabel.includes('.tf')) {
      filtered = files.filter(f => f.type === 'tf');
    } else if (groupLabel.includes('State')) {
      filtered = files.filter(f => f.type === 'tfstate');
    } else if (groupLabel.includes('Plan')) {
      filtered = files.filter(f => f.type === 'plan');
    } else {
      return [];
    }

    return filtered.map(f => {
      const item = new TfScopeFileItem(
        f.name,
        vscode.TreeItemCollapsibleState.None,
        f.filePath,
        'file',
        f
      );
      return item;
    });
  }
}
