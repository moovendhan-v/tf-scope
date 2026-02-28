import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Tab = 'workspace' | 'display' | 'integrations';

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('workspace');
  const [sw, setSw] = useState({ autoScan: true, costDisplay: true, gridLines: true, animations: true });

  const navItems: { value: Tab; label: string }[] = [
    { value: 'workspace', label: 'Workspace' },
    { value: 'display', label: 'Display' },
    { value: 'integrations', label: 'Integrations' },
  ];

  const integrations = [
    { name: 'Terraform Cloud', icon: '🏗', desc: 'Connect your TFC organization', on: false },
    { name: 'AWS Cost Explorer', icon: '💰', desc: 'Pull real cost data from AWS', on: false },
    { name: 'GitHub', icon: '🐙', desc: 'Import .tf files from repositories', on: true },
    { name: 'Slack', icon: '💬', desc: 'Alerts and notifications', on: false },
  ];

  return (
    <div className="h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-7">
          <div className="font-display text-[20px] font-extrabold text-[var(--tv-text)] mb-6">Settings</div>
          <div className="grid grid-cols-[200px_1fr] gap-6">
            {/* Nav */}
            <div className="space-y-0.5">
              {navItems.map(item => (
                <button key={item.value} onClick={() => setTab(item.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150',
                    tab === item.value
                      ? 'bg-[rgba(0,224,144,0.1)] text-[var(--tv-green)]'
                      : 'text-[var(--tv-text2)] hover:bg-[var(--tv-bg3)] hover:text-[var(--tv-text)]'
                  )}>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div>
              {tab === 'workspace' && (
                <div>
                  <SectionTitle>Workspace Defaults</SectionTitle>
                  <Field label="Default Region">
                    <Select defaultValue="us-east-1">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-east-1">us-east-1</SelectItem>
                        <SelectItem value="us-west-2">us-west-2</SelectItem>
                        <SelectItem value="eu-west-1">eu-west-1</SelectItem>
                        <SelectItem value="ap-southeast-1">ap-southeast-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <ToggleRow label="Auto-scan on startup" sub="Automatically scan for Terraform files"
                    checked={sw.autoScan} onCheckedChange={v => setSw(p => ({...p, autoScan: v}))} />
                  <ToggleRow label="Show cost estimates" sub="Display cost alongside resources"
                    checked={sw.costDisplay} onCheckedChange={v => setSw(p => ({...p, costDisplay: v}))} />
                </div>
              )}
              {tab === 'display' && (
                <div>
                  <SectionTitle>Display</SectionTitle>
                  <ToggleRow label="Show grid in graph view" sub="Background grid in force-directed graph"
                    checked={sw.gridLines} onCheckedChange={v => setSw(p => ({...p, gridLines: v}))} />
                  <ToggleRow label="Animate on load" sub="Fade-in animations for list rows"
                    checked={sw.animations} onCheckedChange={v => setSw(p => ({...p, animations: v}))} />
                  <Field label="Graph layout">
                    <Select defaultValue="force">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="force">Force-directed</SelectItem>
                        <SelectItem value="hierarchical">Hierarchical</SelectItem>
                        <SelectItem value="circular">Circular</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
              {tab === 'integrations' && (
                <div>
                  <SectionTitle>Integrations</SectionTitle>
                  <div className="space-y-0">
                    {integrations.map((item, i) => (
                      <div key={item.name}>
                        <div className="flex items-center gap-3 py-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1">
                            <div className="text-[13px] font-medium text-[var(--tv-text)]">{item.name}</div>
                            <div className="text-[11px] text-[var(--tv-text3)] mt-0.5">{item.desc}</div>
                          </div>
                          <Button variant={item.on ? 'primary' : 'default'} size="sm">
                            {item.on ? 'Connected ✓' : 'Connect'}
                          </Button>
                        </div>
                        {i < integrations.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display text-[13px] font-bold text-[var(--tv-text)] mb-3.5 pb-2.5 border-b border-[var(--tv-border)]">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] text-[var(--tv-text2)] mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, checked, onCheckedChange }: {
  label: string; sub: string; checked: boolean; onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--tv-border)]">
      <div>
        <div className="text-xs text-[var(--tv-text)]">{label}</div>
        <div className="text-[10px] text-[var(--tv-text3)] mt-0.5">{sub}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
