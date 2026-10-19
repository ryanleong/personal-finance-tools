'use client';

import { AlertCircle } from 'lucide-react';

import { FileUpload } from './FileUpload';
import { DataPreview } from './DataPreview';
import { ColumnMapping } from './ColumnMapping';
import { SheetAppendCard } from './SheetAppendCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCsvFormatterData } from '../hooks/useCsvFormatterData';

export function CsvFormatterClient() {
  const {
    currentStep,
    parsedData,
    selectedHeaderRow,
    isProcessing,
    previewRows,
    error,
    mappingHeaders,
    handleFileSelect,
    handleHeaderRowSelect,
    handleMappingComplete,
    sheetTarget,
    selectedTab,
    appendStatus,
    appendError,
    duplicateCheck,
    handleTabSelect,
    handleAppend,
    handleStartOver,
  } = useCsvFormatterData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 container grid mx-auto px-6 lg:px-0 py-10">
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
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <Card className="w-[280px] shadow-2xl bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="w-10 h-10 rounded-full border-3 border-border border-t-blue-400 animate-spin" />
                <p className="font-medium text-muted-foreground">Processing...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step Content */}
        <div className="mx-auto w-full">
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
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">Step 1: Select Header Row</h2>
                  <p className="text-sm text-muted-foreground mt-1">Preview your data and select which row contains the column headers</p>
                </div>
                <DataPreview
                  headers={parsedData.headers}
                  rows={parsedData.rows}
                  onHeaderRowSelect={handleHeaderRowSelect}
                  selectedHeaderRow={selectedHeaderRow}
                />
              </div>

              <Separator className="my-8 bg-border" />

              {/* Step 2: Column Mapping */}
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">Step 2: Map Your Columns</h2>
                  <p className="text-sm text-muted-foreground mt-1">Configure how your columns should be formatted</p>
                </div>
                <ColumnMapping
                  headers={mappingHeaders}
                  onMappingComplete={handleMappingComplete}
                />
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
              <SheetAppendCard
                sheetTarget={sheetTarget}
                selectedTab={selectedTab}
                appendStatus={appendStatus}
                appendError={appendError}
                previewRows={previewRows}
                duplicateStatus={duplicateCheck.status}
                duplicateError={duplicateCheck.error}
                duplicates={duplicateCheck.duplicates}
                excluded={duplicateCheck.excluded}
                onToggleRow={duplicateCheck.toggleRow}
                onTabSelect={handleTabSelect}
                onAppend={handleAppend}
                onReset={handleStartOver}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-muted-foreground">
          All processing happens securely on the server. Your files are not stored.
        </div>
      </footer>
    </div>
  );
}
