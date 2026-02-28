import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { COST_MAP } from '../../types';
import type { TerraformFile } from '../../types';

export function CostPage({ files }: { files: TerraformFile[] }) {
  const [selectedId, setSelectedId] = useState('');
  const target = selectedId ? files.filter(f => f.id === selectedId) : files;
  const allRes = target.flatMap(f => f.resources);
  const costed = allRes.map(r => {
    const c = COST_MAP[r.type] || { base: 0, unit: 'mo', note: 'Pricing unavailable' };
    return { ...r, monthlyEst: c.base, unit: c.unit, note: c.note };
  }).sort((a, b) => b.monthlyEst - a.monthlyEst);
  const total = costed.reduce((a, r) => a + r.monthlyEst, 0);
  const billable = costed.filter(r => r.monthlyEst > 0);
  const maxCost = billable[0]?.monthlyEst || 1;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-7 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-display text-[20px] font-extrabold text-[var(--tv-text)] mb-1">Cost Estimate</div>
            <div className="text-xs text-[var(--tv-text2)]">Estimated monthly AWS spend based on your resources</div>
          </div>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All files" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All files</SelectItem>
              {files.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <CostCard num={`$${total.toFixed(2)}`}  label="Est. Monthly Total"   color="var(--tv-amber)" />
          <CostCard num={`$${(total*12).toFixed(2)}`} label="Est. Annual Total" color="var(--tv-purple)" />
          <CostCard num={String(billable.length)}  label="Billable Resources"   color="var(--tv-text)"  />
        </div>
      </div>
      <ScrollArea className="flex-1 mx-7 mb-7">
        <div className="rounded-[14px] border border-[var(--tv-border)] overflow-hidden bg-[var(--tv-bg2)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent cursor-default">
                <TableHead>Resource</TableHead><TableHead>Name</TableHead>
                <TableHead>Est/mo</TableHead><TableHead>Bar</TableHead><TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costed.map((r, i) => (
                <TableRow key={i} className="cursor-default">
                  <TableCell className="text-[var(--tv-purple)] text-[11px]">{r.type}</TableCell>
                  <TableCell className="font-medium text-[var(--tv-text)]">{r.name}</TableCell>
                  <TableCell style={{ color: r.monthlyEst > 0 ? 'var(--tv-amber)' : 'var(--tv-text3)' }}>
                    ${r.monthlyEst.toFixed(3)}
                  </TableCell>
                  <TableCell>
                    <div className="h-1 rounded-sm" style={{
                      width: Math.max(4, (r.monthlyEst / maxCost) * 120),
                      background: r.monthlyEst > 20 ? 'var(--tv-red)' : r.monthlyEst > 5 ? 'var(--tv-amber)' : 'var(--tv-purple)',
                    }} />
                  </TableCell>
                  <TableCell className="text-[11px] text-[var(--tv-text3)]">{r.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-[10px] text-[var(--tv-text3)] mt-3">
          ⚠ Estimates based on minimum/default configurations. Actual costs may vary.
        </p>
      </ScrollArea>
    </div>
  );
}

function CostCard({ num, label, color }: { num: string; label: string; color: string }) {
  return (
    <Card className="p-4">
      <div className="font-display text-[24px] font-extrabold" style={{ color }}>{num}</div>
      <div className="text-[10px] text-[var(--tv-text3)] mt-0.5">{label}</div>
    </Card>
  );
}
