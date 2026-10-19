import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SheetSourceStatus, TabsStatus } from '../hooks/useSheetSource';

export interface SheetSourceBarProps {
  tabs: string[];
  tabsStatus: TabsStatus;
  selectedTab: string | null;
  status: SheetSourceStatus;
  transactionCount: number;
  skippedCount: number;
  error: string | null;
  onSelectTab: (tab: string) => void;
  onRefresh: () => void;
  onRetryTabs: () => void;
}

export function SheetSourceBar({
  tabs,
  tabsStatus,
  selectedTab,
  status,
  transactionCount,
  skippedCount,
  error,
  onSelectTab,
  onRefresh,
  onRetryTabs,
}: SheetSourceBarProps) {
  const showSummary = selectedTab !== null && (status === 'loaded' || transactionCount > 0);

  return (
    <div className="rounded-lg bg-card border border-border px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {tabsStatus === 'error' ? (
          <>
            <p role="alert" className="text-sm text-red-500">Could not load the spreadsheet tabs.</p>
            <Button size="sm" variant="outline" onClick={onRetryTabs}>Retry</Button>
          </>
        ) : (
          <>
            <Select
              value={selectedTab}
              onValueChange={(v) => v && onSelectTab(v)}
              disabled={tabsStatus === 'loading'}
            >
              <SelectTrigger aria-label="Sheet tab" className="w-[240px]">
                <SelectValue placeholder={tabsStatus === 'loading' ? 'Loading tabs...' : 'Select a tab'} />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab} value={tab}>{tab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={selectedTab === null || status === 'loading'}
            >
              Refresh
            </Button>
          </>
        )}
        {showSummary && (
          <p className="text-sm text-muted-foreground">
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} &middot; {skippedCount} row
            {skippedCount !== 1 ? 's' : ''} skipped
          </p>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
