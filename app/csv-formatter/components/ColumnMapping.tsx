'use client';

import { useState } from 'react';
import { Calendar, FileText, DollarSign, Plus, X, ArrowLeftRight, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { clsx } from 'clsx';

interface ColumnMappingProps {
  headers: string[];
  onMappingComplete: (mapping: ColumnMapping) => void;
}

export interface ColumnMapping {
  dateColumn: number;
  descriptionColumns: number[];
  amountType: 'single' | 'split';
  amountColumn?: number;
  positiveIsIncome?: boolean;
  creditColumn?: number;
  debitColumn?: number;
}

export function ColumnMapping({ headers, onMappingComplete }: ColumnMappingProps) {
  const [dateColumn, setDateColumn] = useState<string>('');
  const [descriptionColumns, setDescriptionColumns] = useState<number[]>([]);
  const [amountType, setAmountType] = useState<'single' | 'split'>('single');
  const [amountColumn, setAmountColumn] = useState<string>('');
  const [positiveIsIncome, setPositiveIsIncome] = useState<boolean>(true);
  const [creditColumn, setCreditColumn] = useState<string>('');
  const [debitColumn, setDebitColumn] = useState<string>('');

  const headerItems = headers.map((header, index) => ({
    value: String(index),
    label: header || `Column ${index + 1}`,
  }));

  const incomeItems = [
    { value: 'income', label: 'Income (money in)' },
    { value: 'expense', label: 'Expense (money out)' },
  ];

  const toggleDescriptionColumn = (index: number) => {
    setDescriptionColumns(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  const isValid = () => {
    if (dateColumn === '') return false;
    if (descriptionColumns.length === 0) return false;
    if (amountType === 'single' && amountColumn === '') return false;
    if (amountType === 'split' && (creditColumn === '' || debitColumn === '')) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!isValid()) return;

    const mapping: ColumnMapping = {
      dateColumn: Number(dateColumn),
      descriptionColumns,
      amountType,
      ...(amountType === 'single'
        ? { amountColumn: Number(amountColumn), positiveIsIncome }
        : { creditColumn: Number(creditColumn), debitColumn: Number(debitColumn) })
    };

    onMappingComplete(mapping);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="mb-6 space-y-2">
        <h3 className="text-2xl font-semibold tracking-tight text-[var(--color-app-text)]">Map Your Columns</h3>
        <p className="text-[#a0a0b8]">
          Select which columns from your file correspond to each field.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Date Column */}
        <Card className="bg-[var(--color-app-surface)] border-[var(--color-app-border)]">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="p-2 bg-blue-900 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-300" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-medium text-[var(--color-app-text)]">Date Column</CardTitle>
              <CardDescription className="text-[#a0a0b8]">Select the column containing transaction dates</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-2">
              <Label htmlFor="date-column" className="text-[var(--color-app-text)]">Select Column</Label>
              <Select value={dateColumn} onValueChange={(v) => setDateColumn(v ?? '')} items={headerItems}>
                <SelectTrigger id="date-column" className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)]">
                  <SelectValue placeholder="Select a column..." />
                </SelectTrigger>
                <SelectContent className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)] !w-auto min-w-[var(--anchor-width)]">
                  {headers.map((header, index) => (
                    <SelectItem key={index} value={String(index)} label={header || `Column ${index + 1}`}>
                      {header || `Column ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Description Columns */}
        <Card className="bg-[var(--color-app-surface)] border-[var(--color-app-border)]">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="p-2 bg-green-900 rounded-lg">
              <FileText className="w-5 h-5 text-green-300" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-medium text-[var(--color-app-text)]">Description Columns</CardTitle>
              <CardDescription className="text-[#a0a0b8]">Select one or more columns to merge as description</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {headers.map((header, index) => {
                  const isSelected = descriptionColumns.includes(index);
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDescriptionColumn(index)}
                      className={clsx(
                        "transition-all",
                        isSelected && "bg-green-600 hover:bg-green-700"
                      )}
                    >
                      {isSelected ? <X className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                      {header || `Column ${index + 1}`}
                    </Button>
                  );
                })}
              </div>

              {descriptionColumns.length > 0 && (
                <div className="bg-[var(--color-app-bg)] p-3 rounded-md border border-[var(--color-app-border)]">
                   <Label className="text-xs text-[#a0a0b8] uppercase font-bold tracking-wider mb-2 block">
                     Preview
                   </Label>
                   <div className="flex flex-wrap gap-2 items-center text-sm">
                      {descriptionColumns.map((colIndex, i) => (
                        <div key={colIndex} className="flex items-center">
                          <Badge variant="secondary" className="font-normal bg-[var(--color-app-surface)] text-[var(--color-app-text)] border-[var(--color-app-border)]">
                             {headers[colIndex] || `Column ${colIndex + 1}`}
                          </Badge>
                          {i < descriptionColumns.length - 1 && (
                            <span className="mx-1 text-[#a0a0b8]">+</span>
                          )}
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Amount Configuration */}
        <Card className="bg-[var(--color-app-surface)] border-[var(--color-app-border)]">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="p-2 bg-purple-900 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-300" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-medium text-[var(--color-app-text)]">Amount Configuration</CardTitle>
              <CardDescription className="text-[#a0a0b8]">Choose how transaction amounts are stored</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={clsx(
                  "cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-[var(--color-app-bg)]",
                  amountType === 'single' ? "border-purple-600 bg-purple-900/20" : "border-[var(--color-app-border)]"
                )}
                onClick={() => setAmountType('single')}
              >
                 <div className="flex items-center mb-2">
                    <Coins className={clsx("w-5 h-5 mr-2", amountType === 'single' ? "text-purple-400" : "text-[#a0a0b8]")} />
                    <span className="font-semibold text-sm text-[var(--color-app-text)]">Single Column</span>
                 </div>
                 <p className="text-xs text-[#a0a0b8]">Positive/negative values in one column</p>
              </div>

              <div
                className={clsx(
                  "cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-[var(--color-app-bg)]",
                  amountType === 'split' ? "border-purple-600 bg-purple-900/20" : "border-[var(--color-app-border)]"
                )}
                onClick={() => setAmountType('split')}
              >
                 <div className="flex items-center mb-2">
                    <ArrowLeftRight className={clsx("w-5 h-5 mr-2", amountType === 'split' ? "text-purple-400" : "text-[#a0a0b8]")} />
                    <span className="font-semibold text-sm text-[var(--color-app-text)]">Split Columns</span>
                 </div>
                 <p className="text-xs text-[#a0a0b8]">Separate Credit and Debit columns</p>
              </div>
            </div>

            <Separator className="bg-[var(--color-app-border)]" />

            {amountType === 'single' ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount-column" className="text-[var(--color-app-text)]">Select Amount Column</Label>
                  <Select value={amountColumn} onValueChange={(v) => setAmountColumn(v ?? '')} items={headerItems}>
                    <SelectTrigger id="amount-column" className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)]">
                      <SelectValue placeholder="Select a column..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)] !w-auto min-w-[var(--anchor-width)]">
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={String(index)} label={header || `Column ${index + 1}`}>
                          {header || `Column ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="positive-is-income" className="text-[var(--color-app-text)]">Positive values are</Label>
                  <Select
                    value={positiveIsIncome ? 'income' : 'expense'}
                    onValueChange={(val) => setPositiveIsIncome((val ?? 'income') === 'income')}
                    items={incomeItems}
                  >
                    <SelectTrigger id="positive-is-income" className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)] !w-auto min-w-[var(--anchor-width)]">
                      <SelectItem value="income" label="Income (money in)">Income (money in)</SelectItem>
                      <SelectItem value="expense" label="Expense (money out)">Expense (money out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="credit-column" className="text-[var(--color-app-text)]">Credit Column (Money In)</Label>
                  <Select value={creditColumn} onValueChange={(v) => setCreditColumn(v ?? '')} items={headerItems}>
                    <SelectTrigger id="credit-column" className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)]">
                      <SelectValue placeholder="Select Credit..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)] !w-auto min-w-[var(--anchor-width)]">
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={String(index)} label={header || `Column ${index + 1}`}>
                          {header || `Column ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="debit-column" className="text-[var(--color-app-text)]">Debit Column (Money Out)</Label>
                  <Select value={debitColumn} onValueChange={(v) => setDebitColumn(v ?? '')} items={headerItems}>
                    <SelectTrigger id="debit-column" className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)]">
                      <SelectValue placeholder="Select Debit..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text)] !w-auto min-w-[var(--anchor-width)]">
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={String(index)} label={header || `Column ${index + 1}`}>
                          {header || `Column ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          size="lg"
          className="w-full text-lg h-14 bg-[#ff2d78] hover:bg-[#ff2d78]/90 text-white border-0"
          onClick={handleSubmit}
          disabled={!isValid()}
        >
          Process & Download CSV
        </Button>
      </div>
    </div>
  );
}
