import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { postVsCodeMessage } from '@/lib/utils';
import { COST_MAP } from '../types';
import type { TerraformFile, TerraformResource } from '../types';

export function FileDetailView({ file, onBack }: { file: TerraformFile; onBack: () => void }) {
  const [selectedRes, setSelectedRes] = useState<TerraformResource | null>(null);
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
          <TabsTrigger value="cost">$ Cost</TabsTrigger>
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

        <TabsContent value="cost" className="flex-1 overflow-hidden mt-0">
          <CostView file={file} />
        </TabsContent>

        <TabsContent value="raw" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full p-5">
            <pre className="text-[11px] leading-[1.7] text-[var(--tv-text2)] whitespace-pre-wrap break-all">
              {JSON.stringify(file, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── SIDE PANEL ────────────────────────────────────────────────
function SidePanel({ resource: r, onClose }: { resource: TerraformResource; onClose: () => void }) {
  const costInfo = COST_MAP[r.type];
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

      {costInfo && (
        <div className="p-[14px_18px]">
          <div className="text-[9px] uppercase tracking-[1.2px] text-[var(--tv-text3)] mb-2.5">💰 Cost Estimate</div>
          <div className="bg-[var(--tv-bg3)] border border-[var(--tv-border)] rounded-lg px-2.5 py-2 mb-1.5">
            <div className="text-[var(--tv-purple)] text-[10px] mb-0.5">Monthly estimate</div>
            <div className="text-[var(--tv-amber)] text-[14px] font-bold">
              ${costInfo.base.toFixed(2)}{' '}
              <span className="text-[10px] text-[var(--tv-text2)]">/{costInfo.unit}</span>
            </div>
          </div>
          <div className="text-[10px] text-[var(--tv-text3)]">{costInfo.note}</div>
        </div>
      )}
    </ScrollArea>
  );
}

// ─── GRAPH VIEW ────────────────────────────────────────────────
interface GNode { id: number; label: string; type: string; provider: string; change?: string; x: number; y: number; vx: number; vy: number; }
interface GEdge { from: number; to: number; }

function GraphView({ file, selectedRes, onSelect }: {
  file: TerraformFile; selectedRes: TerraformResource | null;
  onSelect: (r: TerraformResource) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const state = useRef({ zoom: 1, panX: 0, panY: 0, drag: false, lx: 0, ly: 0, nodes: [] as GNode[], edges: [] as GEdge[], af: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; res: TerraformResource } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { zoom, panX, panY, nodes, edges } = state.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(panX, panY); ctx.scale(zoom, zoom);
    const gs = 50, ox = -panX/zoom, oy = -panY/zoom, cw = canvas.width/zoom, ch = canvas.height/zoom;
    ctx.strokeStyle = 'rgba(28,37,48,0.6)'; ctx.lineWidth = 0.5/zoom;
    for (let x = ox-gs; x < ox+cw+gs; x += gs) { ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+ch); ctx.stroke(); }
    for (let y = oy-gs; y < oy+ch+gs; y += gs) { ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+cw,y); ctx.stroke(); }
    for (const e of edges) {
      const f = nodes.find(n=>n.id===e.from), t = nodes.find(n=>n.id===e.to); if(!f||!t) continue;
      const dx=t.x-f.x, dy=t.y-f.y, len=Math.sqrt(dx*dx+dy*dy)||1;
      const ux=dx/len, uy=dy/len, cpx=(f.x+t.x)/2+uy*30, cpy=(f.y+t.y)/2-ux*30;
      const g=ctx.createLinearGradient(f.x,f.y,t.x,t.y);
      g.addColorStop(0,'rgba(0,224,144,0.15)'); g.addColorStop(1,'rgba(0,224,144,0.35)');
      ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.quadraticCurveTo(cpx,cpy,t.x,t.y);
      ctx.strokeStyle=g; ctx.lineWidth=1.5/zoom; ctx.stroke();
      const tx=t.x-ux*24, ty=t.y-uy*24;
      ctx.fillStyle='rgba(0,224,144,0.6)'; ctx.beginPath();
      ctx.moveTo(tx+uy*5/zoom, ty-ux*5/zoom); ctx.lineTo(tx-uy*5/zoom, ty+ux*5/zoom);
      ctx.lineTo(t.x-ux*22, t.y-uy*22); ctx.fill();
    }
    for (const n of nodes) {
      const sel = selectedRes?.id === n.id;
      const col = n.change==='create'?'#00e090':n.change==='update'?'#f5a623':n.change==='destroy'?'#ff6b6b':n.provider==='AWS'?'#00e090':'#9b8fff';
      const r2 = 22;
      if (sel) {
        const gw = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,52);
        gw.addColorStop(0,col+'40'); gw.addColorStop(1,'transparent');
        ctx.fillStyle=gw; ctx.beginPath(); ctx.arc(n.x,n.y,52,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowColor=col; ctx.shadowBlur=sel?18:8;
      ctx.beginPath(); ctx.arc(n.x,n.y,r2,0,Math.PI*2);
      ctx.fillStyle='#131920'; ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=(sel?3:1.5)/zoom; ctx.stroke(); ctx.shadowBlur=0;
      const icons: Record<string,string> = { aws_vpc:'◈',aws_subnet:'▤',aws_instance:'⬡',aws_s3_bucket:'S3',aws_security_group:'🛡',aws_lb:'⚖',variable:'V',output:'O' };
      ctx.font=`${Math.min(12,r2*.55)/zoom}px JetBrains Mono`; ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(icons[n.type]||n.type[0].toUpperCase(), n.x, n.y);
      ctx.font=`${11/zoom}px JetBrains Mono`; ctx.fillStyle='#dde6f0'; ctx.textBaseline='top';
      ctx.fillText(n.label, n.x, n.y+r2+4);
      ctx.font=`${9/zoom}px JetBrains Mono`; ctx.fillStyle=col;
      ctx.fillText(n.type, n.x, n.y+r2+16);
    }
    ctx.restore();
  }, [selectedRes]);

  useEffect(() => {
    const canvas = canvasRef.current; const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    canvas.width = wrap.clientWidth; canvas.height = wrap.clientHeight;
    const res = file.resources; const W = canvas.width, H = canvas.height;
    const nodes: GNode[] = res.map((r,i) => {
      const angle = (i/res.length)*Math.PI*2-Math.PI/2;
      const layer = r.provider==='TERRAFORM'?0.5:(r.deps?.length||0)>0?0.75:0.4;
      return { id:r.id, label:r.name, type:r.type, provider:r.provider, change:r.change,
        x:W/2+Math.cos(angle)*W*layer*0.38+(Math.random()-.5)*60,
        y:H/2+Math.sin(angle)*H*layer*0.38+(Math.random()-.5)*60, vx:0, vy:0 };
    });
    const edges: GEdge[] = [];
    res.forEach(r => (r.deps||[]).forEach(dep => {
      const dn = dep.split('.')[1]||dep;
      const t = res.find(x => x.name===dn || dep.includes('.'+x.name+'.'));
      if (t) edges.push({ from:r.id, to:t.id });
    }));
    state.current.nodes = nodes; state.current.edges = edges;
    state.current.zoom=1; state.current.panX=0; state.current.panY=0;
    let iter=0;
    const step = () => {
      if (iter++>200) { draw(); return; }
      nodes.forEach(n => { n.vx*=0.7; n.vy*=0.7; });
      for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
        const dx=nodes[j].x-nodes[i].x, dy=nodes[j].y-nodes[i].y, d=Math.sqrt(dx*dx+dy*dy)||1;
        const f=Math.min(5000/(d*d),8), fx=dx/d*f, fy=dy/d*f;
        nodes[i].vx-=fx; nodes[i].vy-=fy; nodes[j].vx+=fx; nodes[j].vy+=fy;
      }
      edges.forEach(e => {
        const fn=nodes.find(n=>n.id===e.from), tn=nodes.find(n=>n.id===e.to); if(!fn||!tn) return;
        const dx=tn.x-fn.x, dy=tn.y-fn.y, d=Math.sqrt(dx*dx+dy*dy)||1, f2=(d-120)*0.02;
        fn.vx+=dx/d*f2; fn.vy+=dy/d*f2; tn.vx-=dx/d*f2; tn.vy-=dy/d*f2;
      });
      nodes.forEach(n => {
        n.vx+=(W/2-n.x)*0.002; n.vy+=(H/2-n.y)*0.002; n.x+=n.vx; n.y+=n.vy;
      });
      draw();
      state.current.af = requestAnimationFrame(step);
    };
    state.current.af = requestAnimationFrame(step);
    return () => cancelAnimationFrame(state.current.af);
  }, [file, draw]);

  useEffect(() => { draw(); }, [selectedRes, draw]);

  const getHit = (e: React.MouseEvent<HTMLCanvasElement>): GNode | null => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const { zoom, panX, panY, nodes } = state.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX-rect.left-panX)/zoom, my = (e.clientY-rect.top-panY)/zoom;
    let hit: GNode|null = null; let best = 999;
    nodes.forEach(n => { const d=Math.sqrt((n.x-mx)**2+(n.y-my)**2); if(d<26&&d<best){best=d;hit=n;} });
    return hit;
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full bg-[var(--tv-bg)] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={e => { state.current.drag=true; state.current.lx=e.clientX; state.current.ly=e.clientY; }}
        onMouseUp={e => {
          const moved = Math.abs(e.clientX-state.current.lx)+Math.abs(e.clientY-state.current.ly);
          state.current.drag=false;
          if (moved < 5) { 
            const hit = getHit(e); 
            if (hit) { 
              const r = file.resources.find(x => x.id === hit.id); 
              if (r) onSelect(r); 
            } 
          }
        }}
        onMouseMove={e => {
          if (state.current.drag) {
            state.current.panX+=e.clientX-state.current.lx; state.current.panY+=e.clientY-state.current.ly;
            state.current.lx=e.clientX; state.current.ly=e.clientY; draw();
          }
          const hit = getHit(e);
          if (hit) {
            const r = file.resources.find(x => x.id === hit.id);
            const wrap = wrapRef.current?.getBoundingClientRect();
            if (r && wrap) setTooltip({ x: e.clientX - wrap.left + 12, y: e.clientY - wrap.top - 40, res: r });
          } else setTooltip(null);
        }}
        onMouseLeave={() => setTooltip(null)}
        onWheel={e => { e.preventDefault(); const f=e.deltaY>0?.9:1.1; state.current.zoom=Math.max(.2,Math.min(4,state.current.zoom*f)); draw(); }}
      />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[var(--tv-bg2)] border border-[var(--tv-border)] rounded-[10px] p-3">
        <div className="text-[9px] uppercase tracking-[1.2px] text-[var(--tv-text3)] mb-2">Legend</div>
        {[['var(--tv-purple)','AWS Resource'],['var(--tv-purple)','Terraform Block'],['var(--tv-amber)','Modified'],['var(--tv-red)','Destroyed']].map(([c,l])=>(
          <div key={l} className="flex items-center gap-2 text-[10px] text-[var(--tv-text2)] mb-1.5">
            <div className="w-2 h-2 rounded-full" style={{background:c}} />{l}
          </div>
        ))}
        <div className="text-[9px] text-[var(--tv-text3)] mt-1">Drag · Scroll zoom · Click node</div>
      </div>
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1">
        {[['+',1.2],['-',0.85]].map(([label,f])=>(
          <button key={String(label)} onClick={() => { state.current.zoom=Math.max(.2,Math.min(4,state.current.zoom*(f as number))); draw(); }}
            className="w-[30px] h-[30px] bg-[var(--tv-bg2)] border border-[var(--tv-border)] rounded-lg flex items-center justify-center cursor-pointer text-sm text-[var(--tv-text2)] hover:text-[var(--tv-text)] hover:border-[var(--tv-border2)] transition-colors">
            {label}
          </button>
        ))}
        <button onClick={() => { state.current.zoom=1; state.current.panX=0; state.current.panY=0; draw(); }}
          className="w-[30px] h-[30px] bg-[var(--tv-bg2)] border border-[var(--tv-border)] rounded-lg flex items-center justify-center cursor-pointer text-sm text-[var(--tv-text2)] hover:text-[var(--tv-text)] transition-colors">
          ⌂
        </button>
      </div>
      {tooltip && (
        <div className="absolute bg-[var(--tv-bg2)] border border-[var(--tv-border2)] rounded-lg px-3 py-2.5 text-[11px] pointer-events-none z-10 min-w-[160px]"
          style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="font-semibold mb-1 text-[var(--tv-text)]">{tooltip.res.name}</div>
          <div className="text-[var(--tv-text3)]">{tooltip.res.type}</div>
          {COST_MAP[tooltip.res.type] && (
            <div className="text-[var(--tv-amber)] mt-1">~${COST_MAP[tooltip.res.type].base.toFixed(2)}/{COST_MAP[tooltip.res.type].unit}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COST VIEW ─────────────────────────────────────────────────
function CostView({ file }: { file: TerraformFile }) {
  const costed = file.resources.map(r => {
    const c = COST_MAP[r.type] || { base: 0, unit: 'mo', note: 'Pricing unavailable' };
    return { ...r, monthlyEst: c.base, unit: c.unit, note: c.note };
  }).sort((a,b)=>b.monthlyEst-a.monthlyEst);
  const total = costed.reduce((a,r)=>a+r.monthlyEst,0);
  const billable = costed.filter(r=>r.monthlyEst>0);
  const maxCost = billable[0]?.monthlyEst||1;
  return (
    <ScrollArea className="h-full p-5">
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {[
          { num:`$${total.toFixed(2)}`,       label:'Monthly Estimate', color:'var(--tv-amber)' },
          { num:`$${(total*12).toFixed(2)}`,   label:'Annual Estimate',  color:'var(--tv-purple)' },
          { num:String(billable.length),        label:'Billable Resources',color:'var(--tv-text)'  },
        ].map(s => (
          <div key={s.label} className="rounded-[14px] border border-[var(--tv-border)] bg-[var(--tv-bg2)] p-4">
            <div className="font-display text-2xl font-extrabold" style={{color:s.color}}>{s.num}</div>
            <div className="text-[10px] text-[var(--tv-text3)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-[14px] border border-[var(--tv-border)] overflow-hidden bg-[var(--tv-bg2)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead>Type</TableHead><TableHead>Name</TableHead>
              <TableHead>$/mo</TableHead><TableHead>Bar</TableHead><TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costed.map((r,i)=>(
              <TableRow key={i} className="cursor-default">
                <TableCell className="text-[var(--tv-purple)] text-[11px]">{r.type}</TableCell>
                <TableCell className="font-medium text-[var(--tv-text)]">{r.name}</TableCell>
                <TableCell style={{color:r.monthlyEst>0?'var(--tv-amber)':'var(--tv-text3)'}}>
                  ${r.monthlyEst.toFixed(3)}
                </TableCell>
                <TableCell>
                  <div className="h-1 rounded-sm" style={{
                    width:Math.max(4,(r.monthlyEst/maxCost)*100),
                    background:r.monthlyEst>20?'var(--tv-red)':r.monthlyEst>5?'var(--tv-amber)':'var(--tv-purple)'
                  }}/>
                </TableCell>
                <TableCell className="text-[11px] text-[var(--tv-text3)]">{r.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
