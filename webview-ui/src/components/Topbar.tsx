import React from 'react';
import { Search, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TopbarProps {
  title: string;
  onSearch: () => void;
}

export function Topbar({ title, onSearch }: TopbarProps) {
  return (
    <div className="flex items-center gap-3 px-6 h-[52px] border-b border-[var(--tv-border)] bg-[var(--tv-bg2)] flex-shrink-0">
      <div className="font-display font-bold text-[15px] text-[var(--tv-text)]">{title}</div>
      <div className="flex-1" />
      <button
        onClick={onSearch}
        className="flex items-center gap-2 bg-[var(--tv-bg3)] border border-[var(--tv-border)] rounded-lg px-3 py-1.5 min-w-[220px] cursor-text hover:border-[var(--tv-border2)] transition-colors"
      >
        <Search size={12} className="text-[var(--tv-text3)]" />
        <span className="flex-1 text-[12px] text-[var(--tv-text3)] text-left font-mono">Search resources...</span>
        <span className="flex items-center gap-0.5 text-[var(--tv-text3)] text-[10px]">
          <Command size={9} />K
        </span>
      </button>
    </div>
  );
}
