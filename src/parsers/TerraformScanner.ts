import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface TerraformResource {
  id: number;
  type: string;
  name: string;
  provider: string;
  refs: number;
  attrs: Record<string, string>;
  deps: string[];
  change?: 'create' | 'update' | 'destroy' | 'noop';
}

export interface TerraformFile {
  id: string;
  name: string;
  filePath: string;
  type: 'tf' | 'tfstate' | 'plan';
  ts: string;
  providers: string[];
  resources: TerraformResource[];
  isPlan?: boolean;
  summary?: { add: number; change: number; destroy: number; noop: number };
  workspaceId?: string;
  size: number;
}

export class TerraformScanner {
  private files: Map<string, TerraformFile> = new Map();
  private workspaceFolders: string[] = [];

  constructor() {
    this.workspaceFolders = vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath) || [];
  }

  async scan(): Promise<void> {
    this.files.clear();
    this.workspaceFolders = vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath) || [];

    const config = vscode.workspace.getConfiguration('tf-scope');
    const includePlan = config.get('includePlanFiles', true);

    const patterns = ['**/*.tf', '**/*.tfstate'];
    if (includePlan) {
      patterns.push('**/*.tfplan', '**/tfplan.json', '**/plan.json');
    }

    for (const pattern of patterns) {
      const uris = await vscode.workspace.findFiles(pattern);
      for (const uri of uris) {
        await this.parseFile(uri.fsPath);
      }
    }
  }

  async rescanFile(filePath: string): Promise<void> {
    await this.parseFile(filePath);
  }

  private async parseFile(filePath: string): Promise<void> {
    try {
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const name = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase().slice(1);
      const id = Buffer.from(filePath).toString('base64').slice(0, 16);

      let parsed: TerraformFile | null = null;

      if (ext === 'tfstate') {
        parsed = this.parseTfState(id, name, filePath, content, stat.size);
      } else if (ext === 'json' || ext === 'tfplan') {
        parsed = this.parsePlanJson(id, name, filePath, content, stat.size);
      } else if (ext === 'tf') {
        parsed = this.parseTfFile(id, name, filePath, content, stat.size);
      }

      if (parsed) {
        this.files.set(filePath, parsed);
      }
    } catch (err) {
      console.error(`tf-scope: Failed to parse ${filePath}:`, err);
    }
  }

  private parseTfFile(id: string, name: string, filePath: string, content: string, size: number): TerraformFile {
    const resources: TerraformResource[] = [];
    let rid = 1;

    // A safer way to extract blocks without catastrophic backtracking
    // We'll just match the block headers and then extract the body manually
    const extractBlock = (headerRegex: RegExp, typeFormat: string | ((m: RegExpExecArray) => string), nameFormat: string | ((m: RegExpExecArray) => string)) => {
      let match;
      while ((match = headerRegex.exec(content)) !== null) {
        const blockStart = match.index + match[0].length;
        let braceCount = 1;
        let blockEnd = blockStart;
        for (let i = blockStart; i < content.length; i++) {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') braceCount--;
          if (braceCount === 0) {
            blockEnd = i;
            break;
          }
        }
        
        const body = content.slice(blockStart, blockEnd);
        const typeStr = typeof typeFormat === 'function' ? typeFormat(match) : typeFormat;
        const nameStr = typeof nameFormat === 'function' ? nameFormat(match) : nameFormat;
        
        const attrs = this.extractAttrs(body);
        const deps = this.extractDeps(body);
        
        const provider = typeStr.startsWith('aws_') ? 'AWS' : typeStr.startsWith('azurerm_') ? 'Azure' : typeStr.startsWith('google_') ? 'GCP' : 'OTHER';
        resources.push({ id: rid++, type: typeStr, name: nameStr, provider: provider === 'OTHER' && typeStr === 'module' || typeStr === 'output' || typeStr === 'variable' ? 'TERRAFORM' : provider, refs: deps.length, attrs, deps });
      }
    };

    extractBlock(/resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/gs, m => m[1], m => m[2]);
    extractBlock(/variable\s+"([^"]+)"\s*\{/gs, 'variable', m => m[1]);
    extractBlock(/output\s+"([^"]+)"\s*\{/gs, 'output', m => m[1]);
    extractBlock(/module\s+"([^"]+)"\s*\{/gs, 'module', m => m[1]);
    extractBlock(/data\s+"([^"]+)"\s+"([^"]+)"\s*\{/gs, m => `data.${m[1]}`, m => m[2]);

    const providers: string[] = [];
    if (resources.some(r => r.provider === 'AWS')) { providers.push('AWS'); }
    if (resources.some(r => r.provider === 'Azure')) { providers.push('Azure'); }
    if (resources.some(r => r.provider === 'GCP')) { providers.push('GCP'); }
    if (resources.some(r => r.provider === 'TERRAFORM')) { providers.push('TF'); }

    return { id, name, filePath, type: 'tf', ts: new Date().toISOString(), providers, resources, size };
  }

  private parseTfState(id: string, name: string, filePath: string, content: string, size: number): TerraformFile {
    try {
      const json = JSON.parse(content);
      const resources: TerraformResource[] = [];
      let rid = 1;

      for (const r of json.resources || []) {
        const instance = r.instances?.[0];
        const attrs: Record<string, string> = {};
        if (instance?.attributes) {
          for (const [k, v] of Object.entries(instance.attributes)) {
            if (v !== null && v !== undefined && typeof v !== 'object') {
              attrs[k] = String(v);
            } else if (typeof v === 'object' && v !== null) {
              attrs[k] = JSON.stringify(v).slice(0, 80);
            }
          }
        }
        const type = r.type || 'unknown';
        const provider = type.startsWith('aws_') ? 'AWS' : type.startsWith('azurerm_') ? 'Azure' : type.startsWith('google_') ? 'GCP' : 'OTHER';
        resources.push({ id: rid++, type, name: r.name, provider, refs: 0, attrs, deps: r.dependencies || [] });
      }

      return { id, name, filePath, type: 'tfstate', ts: new Date().toISOString(), providers: ['AWS'], resources, size };
    } catch {
      return { id, name, filePath, type: 'tfstate', ts: new Date().toISOString(), providers: [], resources: [], size };
    }
  }

  private parsePlanJson(id: string, name: string, filePath: string, content: string, size: number): TerraformFile {
    try {
      const json = JSON.parse(content);
      if (!json.resource_changes && !json.planned_values) {
        // Not a plan file
        return this.parseTfFile(id, name, filePath, content, size);
      }

      const resources: TerraformResource[] = [];
      let rid = 1;
      let add = 0, change = 0, destroy = 0, noop = 0;

      for (const rc of json.resource_changes || []) {
        const actions: string[] = rc.change?.actions || ['no-op'];
        let ch: 'create' | 'update' | 'destroy' | 'noop';
        if (actions.includes('create')) { ch = 'create'; add++; }
        else if (actions.includes('delete')) { ch = 'destroy'; destroy++; }
        else if (actions.includes('update')) { ch = 'update'; change++; }
        else { ch = 'noop'; noop++; }

        const after = rc.change?.after || {};
        const attrs: Record<string, string> = {};
        for (const [k, v] of Object.entries(after)) {
          if (typeof v !== 'object') { attrs[k] = String(v); }
        }
        const type = rc.type || 'unknown';
        const provider = type.startsWith('aws_') ? 'AWS' : type.startsWith('azurerm_') ? 'Azure' : type.startsWith('google_') ? 'GCP' : 'OTHER';
        resources.push({ id: rid++, type, name: rc.name, provider, refs: 0, change: ch, attrs, deps: [] });
      }

      return {
        id, name, filePath, type: 'plan', ts: new Date().toISOString(),
        providers: ['AWS'], resources, isPlan: true,
        summary: { add, change, destroy, noop }, size
      };
    } catch {
      return { id, name, filePath, type: 'plan', ts: new Date().toISOString(), providers: [], resources: [], size };
    }
  }

  private extractAttrs(body: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const lines = body.split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*(\w+)\s*=\s*(.+)$/);
      if (m) { attrs[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1'); }
    }
    return attrs;
  }

  private extractDeps(body: string): string[] {
    const deps: string[] = [];
    const refRegex = /(\w+\.\w+\.\w+)/g;
    let m;
    while ((m = refRegex.exec(body)) !== null) {
      const ref = m[1];
      if (!ref.startsWith('var.') && !ref.startsWith('local.') && !ref.startsWith('data.')) {
        deps.push(ref);
      }
    }
    return [...new Set(deps)];
  }

  getFiles(): TerraformFile[] {
    return Array.from(this.files.values());
  }

  getFile(filePath: string): TerraformFile | undefined {
    return this.files.get(filePath);
  }

  getFileById(id: string): TerraformFile | undefined {
    return Array.from(this.files.values()).find(f => f.id === id);
  }
}
