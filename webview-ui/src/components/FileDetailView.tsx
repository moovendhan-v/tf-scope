import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Copy, ExternalLink, Save } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { postVsCodeMessage } from '@/lib/utils';
import type { TerraformFile, TerraformResource } from '../types';

export function FileDetailView({ file, onBack }: { file: TerraformFile; onBack: () => void }) {
  const [selectedRes, setSelectedRes] = useState<TerraformResource | null>(null);
  const [rawText, setRawText] = useState(window.__tf_scope_FILE_CONTENT__ || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // If we're in the dedicated FileDetailPanel, we might have it already injected:
    if (window.__tf_scope_VIEW__ === 'fileDetail' && window.__tf_scope_FILE_CONTENT__) {
      setRawText(window.__tf_scope_FILE_CONTENT__);
    }

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.command === 'fileContent' && msg.filePath === file.filePath) {
        setRawText(msg.content);
      }
    };
    window.addEventListener('message', handleMessage);

    // Always request the content just in case we are in the dashboard and navigated in-place
    postVsCodeMessage('getFileContent', { filePath: file.filePath });

    // Fallback for standalone browser testing
    if (!(window as any).__vscode__) {
      setRawText(`// Mock content for ${file.name}\n// (Running in standalone browser mode)\n\n` + JSON.stringify(file.resources, null, 2));
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [file.id, file.filePath]);

  const res = file.resources;
  const aws = res.filter(r => r.provider === 'AWS').length;
  const tf = res.filter(r => r.provider === 'TERRAFORM').length;
  const vars = res.filter(r => r.type === 'variable').length;
  const outs = res.filter(r => r.type === 'output').length;

  const copyList = () => {
    const text = res.map(r => `${r.type}.${r.name}`).join('\n');
    navigator.clipboard?.writeText(text);
    postVsCodeMessage('copyText', { text });
  };

  const changeBadge = (change?: string) => {
    if (!change) return null;
    const styles: Record<string, string> = {
      create:  'bg-[rgba(0,224,144,0.1)] text-[var(--tv-purple)] border-[rgba(0,224,144,0.3)]',
      update:  'bg-[rgba(245,166,35,0.12)] text-[var(--tv-amber)] border-[rgba(245,166,35,0.3)]',
      destroy: 'bg-[rgba(255,107,107,0.12)] text-[var(--tv-red)] border-[rgba(255,107,107,0.3)]',
      noop:    'bg-[var(--tv-bg5)] text-[var(--tv-text3)] border-[var(--tv-border2)]',
    };
    return (
      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-[.4px] border', styles[change] || styles.noop)}>
        {change}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--tv-bg)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 h-[52px] border-b border-[var(--tv-border)] bg-[var(--tv-bg2)] flex-shrink-0">
        <Button variant="default" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft size={11} /> Back
        </Button>
        <span className="text-[13px] font-medium text-[var(--tv-text)]">{file.name}</span>
        <Badge variant={file.type === 'tfstate' ? 'state' : file.type === 'plan' ? 'plan' : 'tf'}>
          {file.type.toUpperCase()}
        </Badge>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {(file.providers || []).map(p => (
            <Badge key={p} variant={p === 'AWS' ? 'aws' : 'tf'}>{p}</Badge>
          ))}
        </div>
        <Button size="sm" onClick={copyList} className="gap-1"><Copy size={9} /> Copy List</Button>
        <Button size="sm" onClick={() => postVsCodeMessage('openInEditor', { filePath: file.filePath })} className="gap-1">
          <ExternalLink size={9} /> Editor
        </Button>
      </div>

      {/* Plan bar */}
      {file.isPlan && file.summary && (
        <div className="grid grid-cols-4 border-b border-[var(--tv-border)] flex-shrink-0">
          {[
            { icon: '➕', num: file.summary.add,     label: 'Create',  color: 'var(--tv-purple)' },
            { icon: '✏️', num: file.summary.change,  label: 'Modify',  color: 'var(--tv-amber)' },
            { icon: '🗑',  num: file.summary.destroy, label: 'Destroy', color: 'var(--tv-red)'   },
            { icon: '✓',  num: file.summary.noop,    label: 'No-op',   color: 'var(--tv-text2)' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2.5 px-5 py-3 border-r border-[var(--tv-border)] last:border-r-0">
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="font-display text-xl font-extrabold" style={{ color: item.color }}>{item.num}</div>
                <div className="text-[9px] text-[var(--tv-text3)] uppercase tracking-[1px]">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats strip */}
      <div className="flex items-center gap-5 px-6 h-11 border-b border-[var(--tv-border)] bg-[var(--tv-bg2)] flex-shrink-0 overflow-x-auto text-xs">
        {[
          { dot: 'var(--tv-text2)', num: res.length, label: 'Total'    },
          { dot: 'var(--tv-purple)', num: aws,         label: 'AWS'      },
          { dot: 'var(--tv-purple)',num: tf,           label: 'Terraform'},
          { dot: 'var(--tv-amber)', num: vars,         label: 'Variables'},
          { dot: 'var(-tv-blue)',  num: outs,         label: 'Outputs'  },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
            <strong className="text-[var(--tv-text)]">{s.num}</strong>
            <span className="text-[var(--tv-text3)]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="flex-1 flex flex-col overflow-hidden">
        <TabsList>
          <TabsTrigger value="list">☰ List</TabsTrigger>
          <TabsTrigger value="graph">◎ Graph</TabsTrigger>
          <TabsTrigger value="raw">{'{ }'} Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex flex-1 overflow-hidden mt-0">
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent cursor-default">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Refs</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {file.resources.map((r) => (
                    <TableRow key={r.id}
                      data-state={selectedRes?.id === r.id ? 'selected' : undefined}
                      onClick={() => setSelectedRes(prev => prev?.id === r.id ? null : r)}>
                      <TableCell className="text-[var(--tv-text3)] w-10">{r.id}</TableCell>
                      <TableCell className="text-[var(--tv-purple)] text-[11px]">{r.type}</TableCell>
                      <TableCell className="font-medium text-[var(--tv-text)]">{r.name}</TableCell>
                      <TableCell><Badge variant={r.provider === 'AWS' ? 'aws' : 'tf'}>{r.provider}</Badge></TableCell>
                      <TableCell className="text-[var(--tv-text3)] text-[11px]">{r.refs ? `🔗 ${r.refs}` : '—'}</TableCell>
                      <TableCell>{changeBadge(r.change)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          {/* Side panel */}
          <div className={cn(
            'border-l border-[var(--tv-border)] bg-[var(--tv-bg2)] flex-shrink-0 transition-[width] duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden',
            selectedRes ? 'w-[340px]' : 'w-0'
          )}>
            {selectedRes && (
              <SidePanel resource={selectedRes} onClose={() => setSelectedRes(null)} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="graph" className="flex-1 relative overflow-hidden mt-0">
          <GraphView file={file} selectedRes={selectedRes} onSelect={r => setSelectedRes(prev => prev?.id === r.id ? null : r)} />
        </TabsContent>

        <TabsContent value="raw" className="flex-1 flex flex-col overflow-hidden mt-0">
          <div className="flex justify-between items-center px-5 py-2 border-b border-[var(--tv-border)] bg-[var(--tv-bg2)] flex-shrink-0">
            <span className="text-xs text-[var(--tv-text3)] font-mono">{file.filePath}</span>
            <Button size="sm" variant="default" onClick={() => {
              setIsSaving(true);
              postVsCodeMessage('saveFile', { filePath: file.filePath, content: rawText });
              setTimeout(() => setIsSaving(false), 800);
            }} disabled={isSaving} className="gap-1.5 bg-[var(--tv-purple)] hover:bg-[var(--tv-purple)] hover:brightness-110 text-white">
              <Save size={12} /> {isSaving ? 'Saving...' : 'Save File'}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <Editor
              height="100%"
              language={file.type === 'tf' ? 'hcl' : 'json'}
              theme="vs-dark"
              value={rawText}
              onChange={(value) => setRawText(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── SIDE PANEL ────────────────────────────────────────────────
function SidePanel({ resource: r, onClose }: { resource: TerraformResource; onClose: () => void }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-[16px_18px] border-b border-[var(--tv-border)] flex items-start justify-between">
        <div>
          <div className="text-[var(--tv-purple)] text-[11px] mb-0.5">{r.type}</div>
          <div className="font-display text-[17px] font-bold text-[var(--tv-text)]">{r.name}</div>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            <Badge variant={r.provider === 'AWS' ? 'aws' : 'tf'}>{r.provider}</Badge>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--tv-text3)] hover:text-[var(--tv-text)] text-base p-0.5 cursor-pointer">✕</button>
      </div>

      <div className="p-[14px_18px] border-b border-[var(--tv-border)]">
        <div className="text-[9px] uppercase tracking-[1.2px] text-[var(--tv-text3)] mb-2.5">
          📋 Attributes ({Object.keys(r.attrs || {}).length})
        </div>
        {Object.entries(r.attrs || {}).length === 0 ? (
          <div className="text-[var(--tv-text3)] text-[11px]">No attributes</div>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(r.attrs || {}).map(([k, v]) => (
              <div key={k} className="bg-[var(--tv-bg3)] border border-[var(--tv-border)] rounded-lg px-2.5 py-2">
                <div className="text-[var(--tv-purple)] text-[10px] mb-0.5">{k}</div>
                <div className="text-[var(--tv-text)] text-[11px] break-all">{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-[14px_18px] border-b border-[var(--tv-border)]">
        <div className="text-[9px] uppercase tracking-[1.2px] text-[var(--tv-text3)] mb-2.5">
          🔗 Dependencies ({(r.deps || []).length})
        </div>
        {(r.deps || []).length === 0 ? (
          <div className="text-[var(--tv-text3)] text-[11px]">No dependencies</div>
        ) : (
          <div className="space-y-1.5">
            {(r.deps || []).map((d, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--tv-bg3)] border border-[var(--tv-border)] rounded-lg text-[11px]">
                <span className="text-[var(--tv-purple)]">◉</span>
                <span className="text-[var(--tv-text3)]">→</span>
                <span className="text-[var(--tv-text)]">{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── GRAPH VIEW ────────────────────────────────�// ─── GRAPH VIEW ────────────────────────────────────────────────
interface GNode { id: number; label: string; type: string; provider: string; change?: string; x: number; y: number; vx: number; vy: number; }
interface GEdge { from: number; to: number; }

const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

function GraphView({ file, selectedRes, onSelect }: {
  file: TerraformFile; selectedRes: TerraformResource | null;
  onSelect: (r: TerraformResource) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const state = useRef({ zoom: 1, panX: 0, panY: 0, drag: false, draggedNodeId: null as number | null, lx: 0, ly: 0, nodes: [] as GNode[], edges: [] as GEdge[], af: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; res: TerraformResource } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const simRunFileId = useRef<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { zoom, panX, panY, nodes, edges } = state.current;
    
    const dpr = window.devicePixelRatio || 1;
    const logicalW = dimensions.width || canvas.clientWidth || 800;
    const logicalH = dimensions.height || canvas.clientHeight || 600;
    
    if (canvas.width !== logicalW * dpr || canvas.height !== logicalH * dpr) {
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      canvas.style.width = `${logicalW}px`;
      canvas.style.height = `${logicalH}px`;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    
    const ox = -panX/zoom, oy = -panY/zoom, cw = logicalW/zoom, ch = logicalH/zoom;
    
    // Draw Dot Grid
    ctx.fillStyle = '#1c2530';
    const dotSpacing = 24;
    const startX = Math.floor(ox / dotSpacing) * dotSpacing;
    const startY = Math.floor(oy / dotSpacing) * dotSpacing;
    for (let x = startX; x < ox + cw; x += dotSpacing) {
      for (let y = startY; y < oy + ch; y += dotSpacing) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }
    
    const cardW = 180;
    const cardH = 60;
    const cardRadius = 8;
    
    // Draw Edges (Horizontal S-curves between ports)
    for (const e of edges) {
      const f = nodes.find(n=>n.id===e.from), t = nodes.find(n=>n.id===e.to); if(!f||!t) continue;
      
      const fIsLeft = f.x < t.x;
      const p1x = f.x + (fIsLeft ? cardW / 2 : -cardW / 2);
      const p1y = f.y;
      const p2x = t.x + (fIsLeft ? -cardW / 2 : cardW / 2);
      const p2y = t.y;
      
      const cp1x = p1x + (p2x - p1x) * 0.5;
      const cp1y = p1y;
      const cp2x = p1x + (p2x - p1x) * 0.5;
      const cp2y = p2y;
      
      const g = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
      g.addColorStop(0, 'rgba(139, 92, 246, 0.25)'); // purple fade
      g.addColorStop(1, 'rgba(6, 182, 212, 0.4)'); // cyan fade
      
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      
      // Draw arrowhead at target port
      const arrowDir = fIsLeft ? 1 : -1;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.beginPath();
      ctx.moveTo(p2x, p2y);
      ctx.lineTo(p2x - 6 * arrowDir / zoom, p2y - 4 / zoom);
      ctx.lineTo(p2x - 6 * arrowDir / zoom, p2y + 4 / zoom);
      ctx.fill();
    }
    
    // Draw Nodes (Rectangular cards)
    for (const n of nodes) {
      const sel = selectedRes?.id === n.id;
      const col = n.change === 'create' ? '#22c55e' : n.change === 'update' ? '#f5a623' : n.change === 'destroy' ? '#ef4444' : '#3b82f6';
      
      const x = n.x - cardW / 2;
      const y = n.y - cardH / 2;
      
      // Card Shadow / Selection Glow
      ctx.save();
      if (sel) {
        ctx.shadowColor = col;
        ctx.shadowBlur = 14;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
      }
      
      // Background and Border
      ctx.fillStyle = '#0d1117'; // Slate Dark background
      ctx.strokeStyle = sel ? col : '#1c2530'; // border
      ctx.lineWidth = sel ? 2 : 1;
      drawRoundRect(ctx, x, y, cardW, cardH, cardRadius);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      
      // Status Indicator Line (left edge of the card)
      ctx.fillStyle = col;
      ctx.beginPath();
      drawRoundRect(ctx, x, y, 5, cardH, cardRadius);
      ctx.fill();
      // Flatten the right side of the status strip
      ctx.fillRect(x + 3, y, 2, cardH);
      
      // Type/Provider Text (top left)
      ctx.font = '8px monospace';
      ctx.fillStyle = '#7a8899'; // Slate muted text
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(n.type.toUpperCase(), x + 10, y + 8);
      
      // Name Text (middle left, bold)
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#dde6f0'; // bright text
      const displayName = n.label.length > 20 ? n.label.substring(0, 18) + '..' : n.label;
      ctx.fillText(displayName, x + 10, y + 20);

      // Provider Tag/Icon Box (right side)
      ctx.fillStyle = '#131920';
      drawRoundRect(ctx, x + cardW - 36, y + 8, 28, 44, 6);
      ctx.fill();
      ctx.strokeStyle = '#1c2530';
      ctx.stroke();
      
      // Provider Initials inside box
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.provider.substring(0, 3).toUpperCase(), x + cardW - 22, y + 30);
      
      // Draw Ports (circles on left and right)
      // Left Port
      ctx.beginPath();
      ctx.arc(x, y + cardH / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0d1117';
      ctx.fill();
      ctx.strokeStyle = '#1c2530';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Right Port
      ctx.beginPath();
      ctx.arc(x + cardW, y + cardH / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0d1117';
      ctx.fill();
      ctx.strokeStyle = '#1c2530';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.restore();
  }, [selectedRes, dimensions]);

  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const fitToScreen = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const { nodes } = state.current; if (nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const cardW = 180;
    const cardH = 60;
    const padding = 40;
    minX -= (cardW / 2 + padding);
    maxX += (cardW / 2 + padding);
    minY -= (cardH / 2 + padding);
    maxY += (cardH / 2 + padding);

    const graphW = maxX - minX;
    const graphH = maxY - minY;

    const W = dimensions.width || canvas.clientWidth || 800;
    const H = dimensions.height || canvas.clientHeight || 600;

    let zoom = Math.min(W / graphW, H / graphH);
    zoom = Math.max(0.2, Math.min(1.2, zoom));

    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    state.current.zoom = zoom;
    state.current.panX = W / 2 - graphCenterX * zoom;
    state.current.panY = H / 2 - graphCenterY * zoom;

    drawRef.current();
  }, [dimensions]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const isNewFile = file.id !== simRunFileId.current;
    if (isNewFile) {
      simRunFileId.current = file.id;

      const res = file.resources;
      const W = dimensions.width;
      const H = dimensions.height;

      const nodes: GNode[] = res.map((r, i) => {
        const angle = (i / res.length) * Math.PI * 2 - Math.PI / 2;
        const layer = r.provider === 'TERRAFORM' ? 0.5 : (r.deps?.length || 0) > 0 ? 0.75 : 0.4;
        return {
          id: r.id, label: r.name, type: r.type, provider: r.provider, change: r.change,
          x: W / 2 + Math.cos(angle) * W * layer * 0.3 + (Math.random() - .5) * 60,
          y: H / 2 + Math.sin(angle) * H * layer * 0.3 + (Math.random() - .5) * 60, vx: 0, vy: 0
        };
      });

      const edges: GEdge[] = [];
      res.forEach(r => (r.deps || []).forEach(dep => {
        const dn = dep.split('.')[1] || dep;
        const t = res.find(x => x.name === dn || dep.includes('.' + x.name + '.'));
        if (t) edges.push({ from: r.id, to: t.id });
      }));

      for (let iter = 0; iter < 200; iter++) {
        nodes.forEach(n => { n.vx *= 0.7; n.vy *= 0.7; });
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const f = Math.min(20000 / (d * d), 8);
            const fx = (dx / d) * f;
            const fy = (dy / d) * f;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
        edges.forEach(e => {
          const fn = nodes.find(n => n.id === e.from);
          const tn = nodes.find(n => n.id === e.to);
          if (!fn || !tn) return;
          const dx = tn.x - fn.x;
          const dy = tn.y - fn.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const f2 = (d - 220) * 0.02;
          fn.vx += (dx / d) * f2;
          fn.vy += (dy / d) * f2;
          tn.vx -= (dx / d) * f2;
          tn.vy -= (dy / d) * f2;
        });
        nodes.forEach(n => {
          n.vx += (W / 2 - n.x) * 0.002;
          n.vy += (H / 2 - n.y) * 0.002;
          n.x += n.vx;
          n.y += n.vy;
        });
      }

      state.current.nodes = nodes;
      state.current.edges = edges;
      
      // Fit to screen instantly
      fitToScreen();
    } else {
      draw();
    }
  }, [file, dimensions, fitToScreen, draw]);

  useEffect(() => {
    draw();
  }, [selectedRes, draw]);

  const getHit = (e: React.MouseEvent<HTMLCanvasElement>): GNode | null => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const { zoom, panX, panY, nodes } = state.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - panX) / zoom, my = (e.clientY - rect.top - panY) / zoom;
    let hit: GNode | null = null;
    const cardW = 180;
    const cardH = 60;
    nodes.forEach(n => {
      const inside = Math.abs(n.x - mx) <= cardW / 2 && Math.abs(n.y - my) <= cardH / 2;
      if (inside) hit = n;
    });
    return hit;
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full bg-[var(--tv-bg)] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={e => {
          const hit = getHit(e);
          if (hit) {
            state.current.draggedNodeId = hit.id;
          } else {
            state.current.drag = true;
          }
          state.current.lx = e.clientX;
          state.current.ly = e.clientY;
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.cursor = 'grabbing';
          }
        }}
        onMouseUp={e => {
          const moved = Math.abs(e.clientX - state.current.lx) + Math.abs(e.clientY - state.current.ly);
          state.current.drag = false;
          state.current.draggedNodeId = null;
          if (moved < 5) {
            const hit = getHit(e);
            if (hit) {
              const r = file.resources.find(x => x.id === hit.id);
              if (r) onSelect(r);
            }
          }
          const canvas = canvasRef.current;
          if (canvas) {
            const hit = getHit(e);
            canvas.style.cursor = hit ? 'pointer' : 'grab';
          }
        }}
        onMouseMove={e => {
          const canvas = canvasRef.current;
          const { draggedNodeId, drag, zoom } = state.current;
          if (draggedNodeId !== null) {
            const node = state.current.nodes.find(n => n.id === draggedNodeId);
            if (node) {
              const dx = (e.clientX - state.current.lx) / zoom;
              const dy = (e.clientY - state.current.ly) / zoom;
              node.x += dx;
              node.y += dy;
              state.current.lx = e.clientX;
              state.current.ly = e.clientY;
              draw();
            }
          } else if (drag) {
            state.current.panX += e.clientX - state.current.lx;
            state.current.panY += e.clientY - state.current.ly;
            state.current.lx = e.clientX;
            state.current.ly = e.clientY;
            draw();
          }
          const hit = getHit(e);
          if (canvas) {
            if (draggedNodeId !== null || drag) {
              canvas.style.cursor = 'grabbing';
            } else {
              canvas.style.cursor = hit ? 'pointer' : 'grab';
            }
          }
          if (hit) {
            const r = file.resources.find(x => x.id === hit.id);
            const wrap = wrapRef.current?.getBoundingClientRect();
            if (r && wrap) setTooltip({ x: e.clientX - wrap.left + 12, y: e.clientY - wrap.top - 40, res: r });
          } else {
            setTooltip(null);
          }
        }}
        onMouseLeave={() => {
          state.current.drag = false;
          state.current.draggedNodeId = null;
          setTooltip(null);
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.cursor = 'grab';
          }
        }}
        onWheel={e => { e.preventDefault(); const f = e.deltaY > 0 ? .9 : 1.1; state.current.zoom = Math.max(.2, Math.min(4, state.current.zoom * f)); draw(); }}
      />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[var(--tv-bg2)] border border-[var(--tv-border)] rounded-[10px] p-3 pointer-events-none select-none">
        <div className="text-[9px] uppercase tracking-[1.2px] text-[var(--tv-text3)] mb-2">Legend</div>
        {[
          ['#22c55e', 'Created'],
          ['#f5a623', 'Modified'],
          ['#ef4444', 'Destroyed'],
          ['#3b82f6', 'AWS/IaC Resource']
        ].map(([c, l]) => (
          <div key={l} className="flex items-center gap-2 text-[10px] text-[var(--tv-text2)] mb-1.5">
            <div className="w-2.5 h-1 rounded-sm" style={{ background: c }} />{l}
          </div>
        ))}
        <div className="text-[9px] text-[var(--tv-text3)] mt-1.5">Drag · Scroll zoom · Click card</div>
      </div>
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1">
        {[['+', 1.2], ['-', 0.85]].map(([label, f]) => (
          <button key={String(label)} onClick={() => { state.current.zoom = Math.max(.2, Math.min(4, state.current.zoom * (f as number))); draw(); }}
            className="w-[30px] h-[30px] bg-[var(--tv-bg2)] border border-[var(--tv-border)] rounded-lg flex items-center justify-center cursor-pointer text-sm text-[var(--tv-text2)] hover:text-[var(--tv-text)] hover:border-[var(--tv-border2)] transition-colors">
            {label}
          </button>
        ))}
        <button onClick={fitToScreen}
          className="w-[30px] h-[30px] bg-[var(--tv-bg2)] border border-[var(--tv-border)] rounded-lg flex items-center justify-center cursor-pointer text-sm text-[var(--tv-text2)] hover:text-[var(--tv-text)] transition-colors">
          ⌂
        </button>
      </div>
      {tooltip && (
        <div className="absolute bg-[var(--tv-bg2)] border border-[var(--tv-border2)] rounded-lg px-3 py-2.5 text-[11px] pointer-events-none z-10 min-w-[160px]"
          style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="font-semibold mb-1 text-[var(--tv-text)]">{tooltip.res.name}</div>
          <div className="text-[var(--tv-text3)]">{tooltip.res.type}</div>
        </div>
      )}
    </div>
  );
}
