const fs = require('fs');

function extractAttrs(body) {
    const attrs = {};
    const lines = body.split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*(\w+)\s*=\s*(.+)$/);
      if (m) { attrs[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1'); }
    }
    return attrs;
  }

function extractDeps(body) {
    const deps = [];
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

function parseTfFile(content) {
    const resources = [];
    let rid = 1;

    // Parse resource blocks
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
    let match;
    while ((match = resourceRegex.exec(content)) !== null) {
      const type = match[1];
      const resName = match[2];
      const body = match[3];
      const attrs = extractAttrs(body);
      const deps = extractDeps(body);
      const provider = type.startsWith('aws_') ? 'AWS' : type.startsWith('azurerm_') ? 'Azure' : type.startsWith('google_') ? 'GCP' : 'OTHER';
      resources.push({ id: rid++, type, name: resName, provider, refs: deps.length, attrs, deps });
    }
    return resources;
}

const content = fs.readFileSync('samples/serverless-api/main.tf', 'utf8');
console.log(parseTfFile(content));
