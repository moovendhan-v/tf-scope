import React from 'react';
import { TrendingUp, FileCode2, Database, ClipboardList, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { fmtTime, fileIcon, totalResources } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TerraformFile, Page } from '../../types';

const ACTIVITIES = [
  { color: 'var(--tv-purple)',  msg: 'tf-scope scanned workspace files',        time: 'just now' },
  { color: 'var(-tv-blue)',   msg: 'Detected .tf, .tfstate and plan files',   time: '1m ago'   },
  { color: 'var(--tv-purple)', msg: 'Cost estimates calculated',                time: '1m ago'   },
  { color: 'var(--tv-purple)',  msg: 'Dependency graph built',                  time: '1m ago'   },
];

export function DashboardPage({ files, onOpenFile, onNavigate }: {
  files: TerraformFile[];
  onOpenFile: (f: TerraformFile) => void;
  onNavigate: (p: Page) => void;
}) {
  const total = totalResources(files);
  const tfFiles = files.filter(f => f.type === 'tf');
  const stateFiles = files.filter(f => f.type === 'tfstate');
  const planFiles = files.filter(f => f.type === 'plan');
  const pending = planFiles.reduce((a, f) => a + (f.summary?.add ?? 0) + (f.summary?.destroy ?? 0), 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-7 space-y-7">
        {/* Stat row */}
        <div className="grid grid-cols-4 gap-3.5">
          <StatCard num={files.length}  label="Total Files"      color="var(--tv-purple)"  icon={<FileCode2 size={18}/>}  delay="0s"   />
          <StatCard num={total}         label="Total Resources"  color="var(--tv-text)"   icon={<Database size={18}/>}   delay=".05s" />
          <StatCard num={tfFiles.length} label=".tf Files"       color="var(--tv-purple)" icon={<FileCode2 size={18}/>}  delay=".1s"  />
          <StatCard num={pending}       label="Pending Changes"  color={pending > 0 ? 'var(--tv-red)' : 'var(--tv-text3)'}
            icon={<ClipboardList size={18}/>} delay=".15s" />
        </div>

        {/* Two-col */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recent files */}
          <div>
            <SectionHeader title="Recent Files" count={files.length} action="View all" onAction={() => onNavigate('files')} />
            <Card>
              {files.length === 0 ? (
                <CardContent className="py-10 text-center">
                  <p className="text-[var(--tv-text3)] text-xs">No files found in workspace</p>
                </CardContent>
              ) : (
                files.slice(0, 5).map((f, i) => (
                  <React.Fragment key={f.id}>
                    <button
                      onClick={() => onOpenFile(f)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--tv-bg3)] transition-colors text-left"
                    >
                      <span className="text-lg">{fileIcon(f.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[var(--tv-text)] truncate">{f.name}</div>
                        <div className="text-[10px] text-[var(--tv-text3)] mt-0.5">
                          {f.resources.length} resources · {fmtTime(f.ts)}
                        </div>
                      </div>
                      <Badge variant={f.type === 'tfstate' ? 'state' : f.type === 'plan' ? 'plan' : 'tf'}>
                        {f.type}
                      </Badge>
                    </button>
                    {i < files.slice(0, 5).length - 1 && <Separator />}
                  </React.Fragment>
                ))
              )}
            </Card>
          </div>

          {/* Activity */}
          <div>
            <SectionHeader title="Activity" />
            <Card>
              {[...ACTIVITIES, ...files.map(f => ({
                color: 'var(--tv-purple)',
                msg: `${f.name} parsed — ${f.resources.length} resources`,
                time: fmtTime(f.ts),
              }))].slice(0, 7).map((a, i, arr) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-3 px-4 py-3 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                    <div className="flex-1 text-[var(--tv-text)]">{a.msg}</div>
                    <div className="text-[11px] text-[var(--tv-text3)] whitespace-nowrap">{a.time}</div>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </Card>
          </div>
        </div>

        {/* Breakdown */}
        {files.length > 0 && (
          <div>
            <SectionHeader title="File Breakdown" />
            <div className="grid grid-cols-3 gap-3.5">
              <TypeCard label=".tf Configuration" count={tfFiles.length}    color="var(--tv-purple)" icon="📄"
                desc={`${tfFiles.reduce((a,f) => a+f.resources.length, 0)} resources`}
                files={tfFiles} onOpenFile={onOpenFile} />
              <TypeCard label=".tfstate Files"    count={stateFiles.length} color="var(--tv-purple)"   icon="💾"
                desc={`${stateFiles.reduce((a,f) => a+f.resources.length, 0)} tracked`}
                files={stateFiles} onOpenFile={onOpenFile} />
              <TypeCard label="Plan Files"        count={planFiles.length}  color="var(--tv-amber)"  icon="📋"
                desc={`${pending} pending changes`}
                files={planFiles} onOpenFile={onOpenFile} />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function StatCard({ num, label, color, icon, delay }: {
  num: number; label: string; color: string; icon: React.ReactNode; delay: string;
}) {
  return (
    <Card className="animate-fade-up p-[18px_20px]" style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-2">
        <span style={{ color: 'var(--tv-text3)' }}>{icon}</span>
      </div>
      <div className="font-display text-[28px] font-extrabold" style={{ color }}>{num}</div>
      <div className="text-[11px] text-[var(--tv-text2)] mt-0.5">{label}</div>
    </Card>
  );
}

function SectionHeader({ title, count, action, onAction }: {
  title: string; count?: number; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <h2 className="font-display text-[15px] font-bold text-[var(--tv-text)]">{title}</h2>
      {count !== undefined && (
        <span className="bg-[var(--tv-bg4)] border border-[var(--tv-border2)] text-[var(--tv-text2)] text-[10px] px-1.5 py-0.5 rounded-[10px]">
          {count}
        </span>
      )}
      <div className="flex-1" />
      {action && onAction && (
        <button onClick={onAction} className="text-[11px] text-[var(--tv-purple)] hover:opacity-80 flex items-center gap-1">
          {action} <ArrowRight size={10} />
        </button>
      )}
    </div>
  );
}

function TypeCard({ label, count, color, icon, desc, files, onOpenFile }: {
  label: string; count: number; color: string; icon: string;
  desc: string; files: TerraformFile[]; onOpenFile: (f: TerraformFile) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="font-display text-[13px] font-bold text-[var(--tv-text)]">{label}</div>
          <div className="text-[10px] text-[var(--tv-text3)] mt-0.5">{desc}</div>
        </div>
        <div className="font-display text-[22px] font-extrabold" style={{ color }}>{count}</div>
      </div>
      {files.slice(0, 2).map(f => (
        <button key={f.id} onClick={() => onOpenFile(f)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--tv-bg3)] transition-colors text-[11px] text-[var(--tv-text2)]">
          <span>{icon}</span>
          <span className="flex-1 text-left truncate">{f.name}</span>
          <span className="text-[10px] text-[var(--tv-text3)]">{f.resources.length}</span>
        </button>
      ))}
    </Card>
  );
}
