"use client";

import { useState } from "react";
import type { Transaction } from "../types";
import { parseCSV } from "../lib/parser";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
import { UploadSection } from "./UploadSection";
import { FilterBar } from "./FilterBar";
import { SummaryCards } from "./SummaryCards";
import { CategoryBreakdownSection } from "./CategoryBreakdownSection";

interface AnalyticsClientProps {
  initialTransactions?: Transaction[];
}

export function AnalyticsClient({ initialTransactions }: AnalyticsClientProps) {
  const {
    transactions,
    setTransactions,
    status,
    filterState,
    setFilter,
    availableAccounts,
    summary,
  } = useAnalyticsData(initialTransactions);

  const [parseError, setParseError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  async function processFile(file: File) {
    const text = await file.text();
    const result = parseCSV(text);
    if (!result.success) {
      setParseError(result.error);
    } else {
      setParseError(null);
      setTransactions(result.transactions);
    }
  }

  function handleFileSelect(file: File) {
    if (status === "loaded") {
      setPendingFile(file);
      setShowConfirmDialog(true);
    } else {
      processFile(file);
    }
  }

  async function handleConfirm() {
    if (pendingFile) {
      await processFile(pendingFile);
    }
    setPendingFile(null);
    setShowConfirmDialog(false);
  }

  function handleCancel() {
    setPendingFile(null);
    setShowConfirmDialog(false);
  }

  return (
    <div className="bg-background text-foreground min-h-screen p-6 lg:p-10">
      <div className="container mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <h1 className="text-2xl font-semibold mb-8">Analytics</h1>
        </div>
        {/* Upload section always visible at top */}
        <div className="col-span-12">
          <UploadSection
            isLoaded={status === "loaded"}
            onFileSelect={handleFileSelect}
            error={parseError}
          />
        </div>

        {/* Data loaded banner */}
        {status === "loaded" && (
          <div className="col-span-12 rounded-lg bg-card border border-border px-4 py-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-sm font-medium">
              Data loaded &mdash;{" "}
              <span className="font-normal opacity-70">
                {transactions.length} transaction
                {transactions.length !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
        )}

        {/* Filter bar + summary cards + category breakdown â€” shown once data is loaded */}
        {status === "loaded" && (
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
        )}
      </div>

      {/* Replace data confirmation dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-base font-semibold mb-2">Replace data?</h2>
            <p className="text-sm opacity-70 mb-6">
              This will replace your current {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""} with the new file. This
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
