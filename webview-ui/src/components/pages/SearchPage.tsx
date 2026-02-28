import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TerraformFile, TerraformResource } from '../../types';

type SFilter = 'all' | 'aws' | 'variable' | 'output';

export function SearchPage({ files, onOpenFile }: { files: TerraformFile[]; onOpenFile: (f: TerraformFile) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SFilter>('all');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  type ResultItem = TerraformResource & { _file: TerraformFile };
  const results: ResultItem[] = [];
  for (const file of files) {
    for (const r of file.resources) {
      if (filter === 'aws' && r.provider !== 'AWS') continue;
      if (filter === 'variable' && r.type !== 'variable') continue;
      if (filter === 'output' && r.type !== 'output') continue;
      const s = (r.name + r.type + r.provider + Object.values(r.attrs || {}).join('')).toLowerCase();
      if (!query || s.includes(query.toLowerCase())) results.push({ ...r, _file: file });
    }
  }

  const chips: { label: string; value: SFilter }[] = [
    { label: 'All types', value: 'all' },
    { label: 'AWS', value: 'aws' },
    { label: 'Variables', value: 'variable' },
    { label: 'Outputs', value: 'output' },
  ];

  const hl = (text: string, q: string) => {
    if (!q) return <>{text}</>;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <>{text}</>;
    return <>{text.slice(0,i)}<mark className="bg-[rgba(0,224,144,.25)] text-[var(--tv-purple)] rounded-[2px]">{text.slice(i,i+q.length)}</mark>{text.slice(i+q.length)}</>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-7 pb-4">
        <div className="font-display text-[20px] font-extrabold text-[var(--tv-text)] mb-5">Search</div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--tv-text3)]" />
          <Input
            ref={ref}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search resources, types, names across all files..."
            className="pl-9 h-11 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {chips.map(c => (
            <button key={c.value} onClick={() => setFilter(c.value)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] border transition-all duration-200',
                filter === c.value
                  ? 'bg-[rgba(0,224,144,0.1)] border-[var(--tv-purple)] text-[var(--tv-purple)]'
                  : 'bg-[var(--tv-bg3)] border-[var(--tv-border)] text-[var(--tv-text2)] hover:border-[var(--tv-border2)]'
              )}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 px-7 pb-7">
        {results.length === 0 ? (
          <div className="text-center py-16 text-[var(--tv-text3)]">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-display text-sm text-[var(--tv-text2)]">No results found</div>
            <div className="text-xs mt-1">{query ? `No resources match "${query}"` : 'Start typing to search'}</div>
          </div>
        ) : (
          <div className="rounded-[14px] border border-[var(--tv-border)] overflow-hidden bg-[var(--tv-bg2)]">
            <div className="px-4 py-2.5 border-b border-[var(--tv-border)] text-[11px] text-[var(--tv-text3)]">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            {results.map((r, i) => (
              <button key={`${r._file.id}-${r.id}`} onClick={() => onOpenFile(r._file)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[var(--tv-border)] last:border-0 hover:bg-[var(--tv-bg3)] transition-colors text-left">
                <div className="w-9 h-9 rounded-lg bg-[var(--tv-bg4)] flex items-center justify-center text-sm flex-shrink-0">
                  {r.type.startsWith('aws_') ? '☁' : r.type === 'variable' ? 'V' : r.type === 'output' ? 'O' : '🔧'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[var(--tv-text)]">{hl(r.name, query)}</div>
                  <div className="text-[11px] text-[var(--tv-text2)] mt-0.5">{r.type} · {r.provider}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={r._file.type === 'tfstate' ? 'state' : r._file.type === 'plan' ? 'plan' : 'tf'}>
                    {r._file.name}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
