"use client";

import type { Transaction } from "../types";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
import { SheetSourceBar } from "./SheetSourceBar";
import { FilterBar } from "./FilterBar";
import { SummaryCards } from "./SummaryCards";
import { CategoryBreakdownSection } from "./CategoryBreakdownSection";

interface AnalyticsClientProps {
  initialTransactions?: Transaction[];
}

export function AnalyticsClient({ initialTransactions }: AnalyticsClientProps) {
  const {
    tabs,
    tabsStatus,
    selectedTab,
    status,
    transactions,
    skippedCount,
    error,
    selectTab,
    refresh,
    retryTabs,
    filterState,
    setFilter,
    availableAccounts,
    summary,
  } = useAnalyticsData(initialTransactions);

  const hasData = transactions.length > 0;

  return (
    <div className="bg-background text-foreground min-h-screen p-6 lg:p-10">
      <div className="container mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <h1 className="text-2xl font-semibold mb-8">Analytics</h1>
        </div>
        <div className="col-span-12">
          <SheetSourceBar
            tabs={tabs}
            tabsStatus={tabsStatus}
            selectedTab={selectedTab}
            status={status}
            transactionCount={transactions.length}
            skippedCount={skippedCount}
            error={error}
            onSelectTab={selectTab}
            onRefresh={refresh}
            onRetryTabs={retryTabs}
          />
        </div>

        {/* A failed refresh keeps the rows on screen, so data wins over status */}
        {hasData ? (
          <>
            <div className="col-span-12">
              <FilterBar
                filterState={filterState}
                onFilterChange={setFilter}
                availableAccounts={availableAccounts}
              />
            </div>
            <div className="col-span-12">
              <SummaryCards summary={summary} />
            </div>
            <div className="col-span-12">
              <CategoryBreakdownSection summary={summary} />
            </div>
          </>
        ) : (
          <div className="col-span-12 text-sm text-muted-foreground">
            {selectedTab === null && "Choose a tab to load"}
            {selectedTab !== null && status === "loading" && "Loading..."}
            {selectedTab !== null && status === "loaded" && "No transactions found in this tab"}
          </div>
        )}
      </div>
    </div>
  );
}
