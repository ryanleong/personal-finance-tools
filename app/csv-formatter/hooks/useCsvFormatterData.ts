import { useState, useMemo } from 'react';
import type { Step, ParsedFileData } from '../types';
import type { FormattedRow } from '../../../lib/services/formatter';
import type { ColumnMapping as ColumnMappingType } from '../components/ColumnMapping';
import { uploadFileAction, processFileAction } from '../actions';

export function useCsvFormatterData() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [selectedHeaderRow, setSelectedHeaderRow] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCSV, setProcessedCSV] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<FormattedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mappingHeaders = useMemo<string[]>(() => {
    if (!parsedData) return [];
    return selectedHeaderRow === 0
      ? parsedData.headers
      : parsedData.rows[selectedHeaderRow - 1].map(h => String(h));
  }, [parsedData, selectedHeaderRow]);

  const handleFileSelect = async (file: File): Promise<void> => {
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadFileAction(formData);
      if (result.success && result.data) {
        setParsedData(result.data);
        setCurrentStep('configure');
      } else {
        setError(result.error || 'Failed to parse file');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHeaderRowSelect = (rowIndex: number): void => {
    setSelectedHeaderRow(rowIndex);
  };
  const handleMappingComplete = async (mapping: ColumnMappingType): Promise<void> => {
    if (!parsedData) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processFileAction(parsedData.rows, {
        ...mapping,
        headerRowIndex: selectedHeaderRow,
      });
      if (result.success && result.csvString) {
        setProcessedCSV(result.csvString);
        setPreviewRows(result.data || []);
        setCurrentStep('complete');
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleDownload = (): void => {
    if (!processedCSV || !parsedData) return;
    const blob = new Blob([processedCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `formatted_${parsedData.fileName.replace(/\.[^/.]+$/, '')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    // Use setTimeout to ensure the download starts before cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleStartOver = (): void => {
    setCurrentStep('upload');
    setParsedData(null);
    setSelectedHeaderRow(0);
    setProcessedCSV(null);
    setPreviewRows([]);
    setError(null);
  };

  return {
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
  };
}
