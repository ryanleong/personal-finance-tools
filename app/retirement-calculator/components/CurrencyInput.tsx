'use client';

import { useState, useEffect } from 'react';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export function CurrencyInput({ label, value, onChange }: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawValue, setRawValue] = useState(value === 0 ? '' : String(value));

  // Sync display when external value changes (e.g., on load from IndexedDB)
  useEffect(() => {
    if (!isFocused) {
      setRawValue(value === 0 ? '' : String(value));
    }
  }, [value, isFocused]);

  const displayValue = isFocused
    ? rawValue
    : value === 0
    ? ''
    : value.toLocaleString('en-US');

  const handleFocus = () => {
    setIsFocused(true);
    setRawValue(value === 0 ? '' : String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setRawValue(raw);
    onChange(raw === '' ? 0 : Number(raw));
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff2d78] text-sm font-bold pointer-events-none select-none">
          $
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder="0"
          className="w-full bg-input border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#ff2d78] focus:ring-1 focus:ring-[#ff2d78]/20 transition-colors duration-150"
        />
      </div>
    </div>
  );
}
