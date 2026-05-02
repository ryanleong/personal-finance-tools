'use client';

import { useState, useRef, useEffect } from 'react';
import type { TimePeriod } from '../types';
import type { FilterState } from '../hooks/useFilterState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (update: Partial<FilterState>) => void;
  availableAccounts: string[];
}

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'last30', label: 'Last 30 days' },
  { value: 'prev30', label: 'Previous 30 days' },
  { value: 'currentMonth', label: 'Current Month' },
  { value: 'prevMonth', label: 'Previous Month' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom' },
];

export function FilterBar({ filterState, onFilterChange, availableAccounts }: FilterBarProps) {
  const { selectedPeriod, customDateRange, selectedAccounts } = filterState;

  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    if (accountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountDropdownOpen]);

  function getAccountLabel(): string {
    if (selectedAccounts.length === 0) return 'All accounts';
    if (selectedAccounts.length === 1) return selectedAccounts[0];
    return `${selectedAccounts.length} accounts`;
  }

  function toggleAccount(account: string) {
    const isSelected = selectedAccounts.includes(account);
    const updated = isSelected
      ? selectedAccounts.filter((a) => a !== account)
      : [...selectedAccounts, account];
    // If all individual accounts are now checked, normalise back to "all"
    const updatedSet = updated.length === availableAccounts.length ? [] : updated;
    onFilterChange({ selectedAccounts: updatedSet });
  }

  function formatDateValue(date: Date | undefined): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period selector */}
      <Select
        value={selectedPeriod}
        onValueChange={(value: TimePeriod | null) => {
          if (value != null) onFilterChange({ selectedPeriod: value });
        }}
      >
        <SelectTrigger className="min-w-[160px]">
          <SelectValue>
            {PERIOD_OPTIONS.find((opt) => opt.value === selectedPeriod)?.label ?? 'Select period'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom date range inputs — only shown when period is 'custom' */}
      {selectedPeriod === 'custom' && (
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-70 sr-only" htmlFor="custom-start">
            Start
          </label>
          <input
            id="custom-start"
            type="date"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={formatDateValue(customDateRange?.start)}
            onChange={(e) => {
              const start = e.target.value ? new Date(e.target.value) : undefined;
              if (!start) return;
              onFilterChange({
                customDateRange: {
                  start,
                  end: customDateRange?.end ?? start,
                },
              });
            }}
          />
          <span className="text-sm opacity-50">to</span>
          <label className="text-sm opacity-70 sr-only" htmlFor="custom-end">
            End
          </label>
          <input
            id="custom-end"
            type="date"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={formatDateValue(customDateRange?.end)}
            onChange={(e) => {
              const end = e.target.value ? new Date(e.target.value) : undefined;
              if (!end) return;
              onFilterChange({
                customDateRange: {
                  start: customDateRange?.start ?? end,
                  end,
                },
              });
            }}
          />
        </div>
      )}

      {/* Account filter — Issue #4 */}
      {availableAccounts.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setAccountDropdownOpen((prev) => !prev)}
            className="h-9 min-w-[140px] flex items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:opacity-80 transition-opacity"
          >
            <span>{getAccountLabel()}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`flex-shrink-0 opacity-60 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {accountDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 min-w-[180px] bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-xl shadow-lg z-10 py-1">
              {/* All accounts option */}
              <button
                type="button"
                onClick={() => {
                  onFilterChange({ selectedAccounts: [] });
                  setAccountDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:opacity-80 transition-opacity"
              >
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                    selectedAccounts.length === 0
                      ? 'bg-[var(--color-app-text)] border-[var(--color-app-text)]'
                      : 'border-[var(--color-app-border)]'
                  }`}
                >
                  {selectedAccounts.length === 0 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-app-bg)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span>All accounts</span>
              </button>

              <div className="my-1 border-t border-[var(--color-app-border)]" />

              {/* Individual account options */}
              {availableAccounts.map((account) => {
                const isChecked = selectedAccounts.includes(account);
                return (
                  <button
                    key={account}
                    type="button"
                    onClick={() => toggleAccount(account)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:opacity-80 transition-opacity"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                        isChecked
                          ? 'bg-[var(--color-app-text)] border-[var(--color-app-text)]'
                          : 'border-[var(--color-app-border)]'
                      }`}
                    >
                      {isChecked && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-app-bg)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate max-w-[200px]">{account}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
