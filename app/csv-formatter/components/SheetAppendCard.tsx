import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FormattedRow } from '@/lib/services/formatter';

export type AppendStatus = 'idle' | 'appending' | 'done' | 'error';

export interface SheetTarget {
  title?: string;
  tabs: string[];
  tabGids?: Record<string, number>;
  sheetUrl?: string;
  status: 'loading' | 'ready' | 'error';
}

export interface SheetAppendCardProps {
  sheetTarget: SheetTarget;
  selectedTab: string | null;
  appendStatus: AppendStatus;
  appendError: string | null;
  previewRows: FormattedRow[];
  onTabSelect: (tab: string) => void;
  onAppend: () => void;
  onReset: () => void;
}

const PREVIEW_LIMIT = 10;

export function SheetAppendCard({
  sheetTarget,
  selectedTab,
  appendStatus,
  appendError,
  previewRows,
  onTabSelect,
  onAppend,
  onReset,
}: SheetAppendCardProps) {
  const { title, tabs, tabGids, sheetUrl, status } = sheetTarget;
  const gid = selectedTab ? tabGids?.[selectedTab] : undefined;
  const openUrl = sheetUrl && gid !== undefined ? `${sheetUrl}#gid=${gid}` : sheetUrl;
  const canAppend = status === 'ready' && !!selectedTab && appendStatus !== 'appending' && appendStatus !== 'done';

  return (
    <Card className="border-green-700/50 bg-green-900/20">
      <CardContent className="pt-10 pb-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-green-400">Processing Complete!</h2>
          <p className="text-sm text-muted-foreground">
            {title ? `Append to ${title}` : 'Choose a tab to append your formatted rows to.'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          {status === 'loading' && <p className="text-sm text-muted-foreground">Loading tabs...</p>}
          {status === 'error' && <p role="alert" className="text-sm text-red-400">Could not load the spreadsheet tabs.</p>}
          {status === 'ready' && (
            <Select value={selectedTab} onValueChange={(v) => v && onTabSelect(v)} disabled={appendStatus === 'done'}>
              <SelectTrigger aria-label="Sheet tab" className="w-[240px]">
                <SelectValue placeholder="Select a tab" />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab} value={tab}>{tab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={onAppend} disabled={!canAppend} className="bg-green-600 hover:bg-green-700 text-white">
              {appendStatus === 'appending' ? 'Appending...' : 'Append to Sheet'}
            </Button>
            <Button size="lg" variant="outline" onClick={onReset}>
              Format another file
            </Button>
          </div>

          {appendStatus === 'error' && appendError && (
            <p role="alert" className="text-sm text-red-400">{appendError}</p>
          )}
          {appendStatus === 'done' && (
            <p className="text-sm text-green-400">
              Appended {previewRows.length} rows to {selectedTab}.{' '}
              {openUrl && (
                <a href={openUrl}target="_blank" rel="noopener noreferrer" className="underline">Open sheet</a>
              )}
            </p>
          )}
        </div>

        <div className="mt-6 text-left">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="bg-background px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground">
              Preview
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-foreground">Date</TableHead>
                  <TableHead className="text-xs text-foreground">Category</TableHead>
                  <TableHead className="text-xs text-foreground">Description</TableHead>
                  <TableHead className="text-xs text-foreground">Account</TableHead>
                  <TableHead className="text-xs text-right text-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono text-foreground">{row.date}</TableCell>
                    <TableCell className="text-xs text-foreground"></TableCell>
                    <TableCell className="text-xs max-w-[240px] truncate text-foreground">{row.description}</TableCell>
                    <TableCell className="text-xs text-foreground"></TableCell>
                    <TableCell className={`text-xs text-right font-mono ${row.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {row.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {previewRows.length > PREVIEW_LIMIT && (
              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-center">
                Showing {PREVIEW_LIMIT} of {previewRows.length} rows
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
