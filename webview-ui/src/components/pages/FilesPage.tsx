import React, { useState } from 'react';
import { RefreshCw, Eye, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { fmtTime, fileIcon, fmtBytes, postVsCodeMessage } from '@/lib/utils';
import type { TerraformFile } from '../../types';

type Filter = 'all' | 'tf' | 'tfstate' | 'plan';

export function FilesPage({ files, onOpenFile }: { files: TerraformFile[]; onOpenFile: (f: TerraformFile) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const shown = filter === 'all' ? files : files.filter(f => f.type === filter);

  const chips: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: '.tf', value: 'tf' },
    { label: '.tfstate', value: 'tfstate' },
    { label: 'plan', value: 'plan' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-7 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-display text-[20px] font-extrabold text-[var(--tv-text)] mb-1">Files</div>
            <div className="text-xs text-[var(--tv-text2)]">All scanned Terraform files in your workspace</div>
          </div>
          <Button variant="primary" onClick={() => postVsCodeMessage('refresh')} className="gap-1.5">
            <RefreshCw size={11} /> Refresh Scan
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {chips.map(c => (
            <button key={c.value} onClick={() => setFilter(c.value)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] border transition-all duration-200',
                filter === c.value
                  ? 'bg-[rgba(0,224,144,0.1)] border-[var(--tv-green2)] text-[var(--tv-green)]'
                  : 'bg-[var(--tv-bg3)] border-[var(--tv-border)] text-[var(--tv-text2)] hover:border-[var(--tv-border2)]'
              )}>
              {c.label}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[11px] text-[var(--tv-text3)]">{shown.length} file{shown.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <ScrollArea className="flex-1 mx-7 mb-7">
        <div className="rounded-[14px] border border-[var(--tv-border)] overflow-hidden bg-[var(--tv-bg2)]">
          {shown.length === 0 ? (
            <div className="text-center py-16 text-[var(--tv-text3)]">
              <div className="text-4xl mb-3">📄</div>
              <div className="font-display text-sm text-[var(--tv-text2)]">No files found</div>
              <div className="text-xs mt-1">Open a workspace with .tf or .tfstate files</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent cursor-default">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map(f => <FileRow key={f.id} file={f} onOpen={() => onOpenFile(f)} />)}
              </TableBody>
            </Table>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function FileRow({ file: f, onOpen }: { file: TerraformFile; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <TableRow onClick={onOpen} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--tv-bg4)] flex items-center justify-center text-sm flex-shrink-0">
            {fileIcon(f.type)}
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tv-text)]">{f.name}</div>
            <div className="text-[10px] text-[var(--tv-text3)] mt-0.5 truncate max-w-[180px]">
              {f.filePath.split(/[/\\]/).slice(-3, -1).join('/')}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={f.type === 'tfstate' ? 'state' : f.type === 'plan' ? 'plan' : 'tf'}>{f.type}</Badge>
      </TableCell>
      <TableCell>
        <span className="font-medium text-[var(--tv-text)]">{f.resources.length}</span>
        <span className="text-[11px] text-[var(--tv-text3)] ml-1">resources</span>
      </TableCell>
      <TableCell className="text-[var(--tv-text2)]">{fmtBytes(f.size)}</TableCell>
      <TableCell className="text-[var(--tv-text2)]">{fmtTime(f.ts)}</TableCell>
      <TableCell>
        <div className={cn('flex gap-1.5 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
          <Button size="sm" variant="default" onClick={e => { e.stopPropagation(); onOpen(); }} className="gap-1">
            <Eye size={9} /> View
          </Button>
          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); postVsCodeMessage('openInEditor', { filePath: f.filePath }); }}>
            <ExternalLink size={9} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
