import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TerraformFile } from '../../types';

export function DiffPage({ files }: { files: TerraformFile[] }) {
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');
  const fa = files.find(f => f.id === aId);
  const fb = files.find(f => f.id === bId);
  const aNames = new Set((fa?.resources || []).map(r => `${r.type}.${r.name}`));
  const bNames = new Set((fb?.resources || []).map(r => `${r.type}.${r.name}`));
  const onlyA = [...aNames].filter(n => !bNames.has(n));
  const onlyB = [...bNames].filter(n => !aNames.has(n));
  const both = [...aNames].filter(n => bNames.has(n));
  const hasDiff = fa && fb && fa.id !== fb.id;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-7 pb-4">
        <div className="font-display text-[20px] font-extrabold text-[var(--tv-text)] mb-1">Diff / Compare</div>
        <div className="text-xs text-[var(--tv-text2)] mb-5">Compare resources between two files</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] text-[var(--tv-text2)] mb-1.5">File A (Base)</div>
            <Select value={aId} onValueChange={setAId}>
              <SelectTrigger><SelectValue placeholder="— Select file —" /></SelectTrigger>
              <SelectContent>{files.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[11px] text-[var(--tv-text2)] mb-1.5">File B (Compare)</div>
            <Select value={bId} onValueChange={setBId}>
              <SelectTrigger><SelectValue placeholder="— Select file —" /></SelectTrigger>
              <SelectContent>{files.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {hasDiff && (
          <div className="flex gap-3 mt-4 flex-wrap">
            <Badge variant="green">+{onlyB.length} only in {fb!.name}</Badge>
            <Badge variant="red">-{onlyA.length} only in {fa!.name}</Badge>
            <Badge variant="amber">{both.length} in both</Badge>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden mx-7 mb-7 rounded-[14px] border border-[var(--tv-border)] bg-[var(--tv-bg2)]">
        {!hasDiff ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--tv-text3)]">
            <div className="text-4xl mb-3">⇄</div>
            <div className="font-display text-sm text-[var(--tv-text2)]">Select two files to compare</div>
          </div>
        ) : fa!.id === fb!.id ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--tv-text3)]">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="font-display text-sm text-[var(--tv-text2)]">Select two different files</div>
          </div>
        ) : (
          <div className="flex h-full">
            <DiffPane title={fa!.name} type={fa!.type}
              items={[...onlyA.map(n=>({n, side:'only' as const})), ...both.map(n=>({n, side:'both' as const}))]} />
            <div className="w-px bg-[var(--tv-border)]" />
            <DiffPane title={fb!.name} type={fb!.type}
              items={[...onlyB.map(n=>({n, side:'only' as const})), ...both.map(n=>({n, side:'both' as const}))]} right />
          </div>
        )}
      </div>
    </div>
  );
}

function DiffPane({ title, type, items, right }: {
  title: string; type: string;
  items: { n: string; side: 'only' | 'both' }[];
  right?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--tv-border)] bg-[var(--tv-bg3)] flex items-center gap-2.5 text-[11px] flex-shrink-0">
        <strong className="text-[var(--tv-text)]">{title}</strong>
        <Badge variant={type === 'tfstate' ? 'state' : type === 'plan' ? 'plan' : 'tf'}>{type}</Badge>
      </div>
      <ScrollArea className="flex-1">
        {items.map(({ n, side }, i) => {
          const [rtype, name] = n.split('.');
          const isOnly = side === 'only';
          return (
            <div key={i} className="flex gap-3 px-5 py-2.5 border-b border-[rgba(28,37,48,.4)] last:border-0 cursor-pointer hover:bg-[var(--tv-bg3)] transition-colors"
              style={{ background: isOnly ? (right ? 'rgba(255,107,107,.04)' : 'rgba(0,224,144,.04)') : 'rgba(245,166,35,.03)' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{ background: isOnly ? (right ? 'var(--tv-red)' : 'var(--tv-green)') : 'var(--tv-amber)' }} />
              <div>
                <div className="text-xs font-medium text-[var(--tv-text)]">{name}</div>
                <div className="text-[10px] text-[var(--tv-text3)]">{rtype}</div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
