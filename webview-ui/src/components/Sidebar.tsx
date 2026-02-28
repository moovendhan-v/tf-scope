import React from 'react';
import { LayoutDashboard, Files, Search, GitCompare, DollarSign, Settings, Database, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  expanded: boolean;
  onToggle: () => void;
  fileCount: number;
}

const navMain = [
  { page: 'dashboard' as Page, icon: LayoutDashboard, label: 'Dashboard' },
  { page: 'files'     as Page, icon: Files,          label: 'Files'     },
];
const navTools = [
  { page: 'search'   as Page, icon: Search,     label: 'Search'       },
  { page: 'diff'     as Page, icon: GitCompare, label: 'Diff / Compare'},
  { page: 'cost'     as Page, icon: DollarSign, label: 'Cost Estimate' },
];
const navAccount = [
  { page: 'settings' as Page, icon: Settings, label: 'Settings' },
];

export function Sidebar({ currentPage, onNavigate, expanded, onToggle, fileCount }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <nav
        className={cn(
          'flex flex-col flex-shrink-0 bg-[var(--tv-bg2)] border-r border-[var(--tv-border)] overflow-hidden z-20 relative transition-[width] duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]',
          expanded ? 'w-[220px]' : 'w-[58px]'
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-[11px] py-3.5 border-b border-[var(--tv-border)] flex-shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-9 h-9 rounded-[9px] flex items-center justify-center font-display font-extrabold text-[15px] text-black flex-shrink-0 cursor-pointer select-none"
            style={{ background: 'linear-gradient(135deg,var(--tv-green),var(--tv-cyan))' }}
          >
            TV
          </button>
          {expanded && (
            <span className="font-display font-extrabold text-[16px] whitespace-nowrap text-[var(--tv-text)] animate-fade-in">
              TerraVis
            </span>
          )}
        </div>

        {/* Toggle chevron */}
        <button
          onClick={onToggle}
          className="absolute right-[-12px] top-[22px] w-6 h-6 rounded-full bg-[var(--tv-bg3)] border border-[var(--tv-border2)] flex items-center justify-center cursor-pointer z-10 text-[var(--tv-text3)] hover:text-[var(--tv-text)] transition-transform duration-[250ms]"
          style={{ transform: expanded ? 'scaleX(-1)' : 'none' }}
        >
          <ChevronRight size={10} />
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-1">
          <NavSection label="Main" expanded={expanded}>
            {navMain.map(item => (
              <NavItem key={item.page} {...item} active={currentPage === item.page} expanded={expanded}
                badge={item.page === 'files' ? String(fileCount) : undefined}
                onClick={() => onNavigate(item.page)} />
            ))}
          </NavSection>

          <Separator className="my-1 mx-2" />

          <NavSection label="Tools" expanded={expanded}>
            {navTools.map(item => (
              <NavItem key={item.page} {...item} active={currentPage === item.page} expanded={expanded}
                onClick={() => onNavigate(item.page)} />
            ))}
          </NavSection>

          <Separator className="my-1 mx-2" />

          <NavSection label="Account" expanded={expanded}>
            {navAccount.map(item => (
              <NavItem key={item.page} {...item} active={currentPage === item.page} expanded={expanded}
                onClick={() => onNavigate(item.page)} />
            ))}
          </NavSection>
        </div>

        {/* User */}
        <div className="border-t border-[var(--tv-border)] p-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-[var(--tv-bg4)] transition-colors">
            <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--tv-purple),var(--tv-blue))' }}>
              TF
            </div>
            {expanded && (
              <div className="animate-fade-in">
                <div className="text-[11px] font-medium text-[var(--tv-text)]">Workspace</div>
                <div className="text-[9px] text-[var(--tv-green)]">TerraVis MVP</div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}

function NavSection({ label, expanded, children }: { label: string; expanded: boolean; children: React.ReactNode }) {
  return (
    <div className="px-2">
      {expanded && (
        <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--tv-text3)] px-2.5 py-1.5 animate-fade-in">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, expanded, badge, onClick }: {
  icon: any; label: string; active: boolean;
  expanded: boolean; badge?: string; onClick: () => void;
}) {
  const el = (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-[11px] px-2.5 py-[9px] rounded-lg cursor-pointer transition-all duration-150 text-[12px] whitespace-nowrap font-mono',
        active
          ? 'bg-[rgba(0,224,144,0.1)] text-[var(--tv-green)]'
          : 'text-[var(--tv-text2)] hover:bg-[var(--tv-bg4)] hover:text-[var(--tv-text)]'
      )}
    >
      <Icon size={16} className="flex-shrink-0 w-5 text-center" />
      {expanded && <span className="flex-1 text-left animate-fade-in">{label}</span>}
      {expanded && badge && (
        <span className="bg-[var(--tv-bg5)] border border-[var(--tv-border2)] text-[var(--tv-text2)] text-[9px] px-1.5 py-0.5 rounded-[10px] animate-fade-in">
          {badge}
        </span>
      )}
    </button>
  );

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{el}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return el;
}
