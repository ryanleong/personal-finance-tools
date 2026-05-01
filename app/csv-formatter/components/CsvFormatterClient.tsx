'use client';

import { CheckCircle2, Download, AlertCircle } from 'lucide-react';

import { FileUpload } from './FileUpload';
import { DataPreview } from './DataPreview';
import { ColumnMapping } from './ColumnMapping';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCsvFormatterData } from '../hooks/useCsvFormatterData';

export function CsvFormatterClient() {
  const {
    currentStep,
    parsedData,
    selectedHeaderRow,
    isProcessing,
    processedCSV,
    previewRows,
    error,
    mappingHeaders,
    handleFileSelect,
    handleHeaderRowSelect,
    handleMappingComplete,
    handleDownload,
    handleStartOver,
  } = useCsvFormatterData();

  return (
    <div className="min-h-screen bg-[var(--color-app-bg)] text-[var(--color-app-text)] flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-[var(--color-app-bg)]/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <Card className="w-[280px] shadow-2xl bg-[var(--color-app-surface)] border-[var(--color-app-border)]">
              <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="w-10 h-10 rounded-full border-3 border-[var(--color-app-border)] border-t-blue-400 animate-spin" />
                <p className="font-medium text-[#a0a0b8]">Processing...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'upload' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          )}

          {currentStep === 'configure' && parsedData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* Step 1: Preview & Select Header */}
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--color-app-text)]">Step 1: Select Header Row</h2>
                  <p className="text-sm text-[#a0a0b8] mt-1">Preview your data and select which row contains the column headers</p>
                </div>
                <DataPreview
                  headers={parsedData.headers}
                  rows={parsedData.rows}
                  onHeaderRowSelect={handleHeaderRowSelect}
                  selectedHeaderRow={selectedHeaderRow}
                />
              </div>

              <Separator className="my-8 bg-[var(--color-app-border)]" />

              {/* Step 2: Column Mapping */}
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--color-app-text)]">Step 2: Map Your Columns</h2>
                  <p className="text-sm text-[#a0a0b8] mt-1">Configure how your columns should be formatted</p>
                </div>
                <ColumnMapping
                  headers={mappingHeaders}
                  onMappingComplete={handleMappingComplete}
                />
              </div>
            </div>
          )}

          {currentStep === 'complete' && processedCSV && parsedData && (
            <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
              <Card className="border-green-700/50 bg-green-900/20">
                <CardContent className="pt-10 pb-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold tracking-tight text-green-400">Processing Complete!</h2>
                    <p className="text-sm text-[#a0a0b8]">
                      Your file has been formatted and is ready for download.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button size="lg" onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <Download className="w-4 h-4" />
                      Download CSV
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleStartOver}>
                      Format Another File
                    </Button>
                  </div>

                  <div className="mt-6 text-left">
                    <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface)] overflow-hidden">
                      <div className="bg-[var(--color-app-bg)] px-4 py-2 border-b border-[var(--color-app-border)] text-xs font-medium text-[#a0a0b8]">
                        Preview
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs text-[var(--color-app-text)]">Date</TableHead>
                            <TableHead className="text-xs text-[var(--color-app-text)]">Category</TableHead>
                            <TableHead className="text-xs text-[var(--color-app-text)]">Description</TableHead>
                            <TableHead className="text-xs text-right text-[var(--color-app-text)]">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-mono text-[var(--color-app-text)]">{row.date}</TableCell>
                              <TableCell className="text-xs text-[var(--color-app-text)]"></TableCell>
                              <TableCell className="text-xs max-w-[240px] truncate text-[var(--color-app-text)]">{row.description}</TableCell>
                              <TableCell className={`text-xs text-right font-mono ${row.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {row.amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {previewRows.length > 10 && (
                        <div className="px-4 py-2 border-t border-[var(--color-app-border)] text-xs text-[#a0a0b8] text-center">
                          Showing 10 of {previewRows.length} rows
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-app-border)] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-[#a0a0b8]">
          All processing happens securely on the server. Your files are not stored.
        </div>
      </footer>
    </div>
  );
}
