# TFScope — Terraform Infrastructure Visualizer

A production-grade VS Code extension for visualizing and analyzing Terraform files.

## Features

- 🔍 **Auto-scan** your workspace for `.tf`, `.tfstate`, and plan JSON files
- 📊 **Dashboard** — overview of all files, resources, and activity
- 📋 **List View** — detailed resource table with click-to-inspect side panel
- 🕸 **Graph View** — interactive force-directed dependency graph
- 💰 **Cost Estimation** — estimated monthly AWS spend per resource
- ⇄ **Diff Tool** — compare resources between two files
- 🔎 **Search** — full-text search across all resources
- 📄 **Raw JSON** — inspect the parsed data directly

## Getting Started

### Installation

1. Install the extension from the VS Code Marketplace
2. Open a workspace containing Terraform files
3. TFScope will auto-scan and show files in the sidebar

### Usage

1. **Sidebar** — Click the TFScope icon in the Activity Bar to see detected files
2. **Open Dashboard** — Click the layout icon in the sidebar header
3. **Visualize a File** — Click any file in the tree, or right-click a `.tf` file in Explorer
4. **Commands**:
   - `TFScope: Open Dashboard`
   - `TFScope: Refresh Files`
   - `TFScope: Scan Workspace`

## Development

### Prerequisites
- Node.js 18+
- VS Code 1.85+

### Setup

```bash
# Install extension dependencies
npm install

# Install webview UI dependencies
cd webview-ui && npm install

# Build both (from root)
npm run vscode:prepublish
```

### Dev Mode

In two terminals:

```bash
# Terminal 1 - watch extension
npm run watch:ext

# Terminal 2 - watch webview
npm run watch:webview
```

Then press `F5` in VS Code to launch the Extension Development Host.

### Project Structure

```
TFScope-vscode/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── parsers/
│   │   └── TerraformScanner.ts   # File scanner & parser
│   ├── panels/
│   │   ├── DashboardPanel.ts     # Dashboard webview
│   │   ├── FileDetailPanel.ts    # File detail webview
│   │   └── webviewUtils.ts       # Shared utilities
│   └── providers/
│       └── TFScopeFileProvider.ts # Tree view provider
├── webview-ui/
│   ├── src/
│   │   ├── App.tsx               # Root component + routing
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── FileDetailView.tsx # List/Graph/Cost/Raw views
│   │   │   ├── ui.tsx             # Shared UI components
│   │   │   └── pages/
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── FilesPage.tsx
│   │   │       ├── SearchPage.tsx
│   │   │       ├── DiffPage.tsx
│   │   │       ├── CostPage.tsx
│   │   │       └── SettingsPage.tsx
│   │   └── lib/
│   │       └── utils.ts
│   └── index.html                # Dev mode entry
├── media/
│   └── TFScope.svg
├── package.json
└── tsconfig.json
```

## File Support

| File Type | Detection | Features |
|-----------|-----------|----------|
| `*.tf` | `resource`, `variable`, `output`, `module`, `data` blocks | Full parse, graph, cost |
| `*.tfstate` | JSON state format | Instance attributes, dependencies |
| `*.tfplan`, `plan.json` | Terraform plan JSON | Change summary (create/update/destroy/noop) |

## Cost Estimates

Cost estimates are based on minimum/default AWS pricing for common resource types. Actual costs depend on usage, region, and configuration.

## Known Limitations (MVP)

- HCL parsing uses regex (not a full HCL AST parser) — complex expressions may not fully resolve
- Graph layout runs a simplified force-directed simulation
- Cost map covers common AWS resources; GCP/Azure pricing not yet included
- State file parsing reads from `instances[0].attributes`
