import { useState, useMemo, useEffect, useRef } from 'react';
import type { Step, ParsedFileData } from '../types';
import type { FormattedRow } from '../../../lib/services/formatter';
import type { ColumnMapping as ColumnMappingType } from '../components/ColumnMapping';
import type { AppendStatus, SheetTarget } from '../components/SheetAppendCard';
import { uploadFileAction, processFileAction, getSheetTargetAction, appendToSheetAction } from '../actions';
import { useLastTab } from './useLastTab';

const INITIAL_TARGET: SheetTarget = { tabs: [], status: 'loading' };

export function useCsvFormatterData() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [selectedHeaderRow, setSelectedHeaderRow] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewRows, setPreviewRows] = useState<FormattedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sheetTarget, setSheetTarget] = useState<SheetTarget>(INITIAL_TARGET);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [appendStatus, setAppendStatus] = useState<AppendStatus>('idle');
  const appendInFlight = useRef(false);
  const resetGeneration = useRef(0);
  const [appendError, setAppendError] = useState<string | null>(null);
  const { readLastTab, saveLastTab } = useLastTab();

  useEffect(() => {
    if (currentStep !== 'complete') return;
    let cancelled = false;
    getSheetTargetAction()
      .then(result => {
        if (cancelled) return;
        if (!result.success || !result.tabs) {
          setSheetTarget({ tabs: [], status: 'error' });
          return;
        }
        setSheetTarget({ status: 'ready', title: result.title, tabs: result.tabs, tabGids: result.tabGids, sheetUrl: result.sheetUrl });
        const last = readLastTab();
        setSelectedTab(last && result.tabs.includes(last) ? last : null);
      })
      .catch(() => {
        if (!cancelled) setSheetTarget({ tabs: [], status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [currentStep, readLastTab]);

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
      if (result.success && result.data) {
        setPreviewRows(result.data);
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
  const handleTabSelect = (tab: string): void => {
    setSelectedTab(tab);
    saveLastTab(tab);
  };

  const handleAppend = async (): Promise<void> => {
    // Ref lock: state is stale between two quick clicks.
    if (!selectedTab || appendInFlight.current || appendStatus === 'done') return;
    appendInFlight.current = true;
    const generation = resetGeneration.current;
    setAppendStatus('appending');
    setAppendError(null);
    try {
      const result = await appendToSheetAction(selectedTab, previewRows);
      if (generation !== resetGeneration.current) return; // user started over mid-append
      if (result.success) {
        setAppendStatus('done');
      } else {
        setAppendStatus('error');
        setAppendError(result.error || 'Failed to append rows');
      }
    } catch (err) {
      if (generation !== resetGeneration.current) return;
      setAppendStatus('error');
      setAppendError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (generation === resetGeneration.current) appendInFlight.current = false;
    }
  };

  const handleStartOver = (): void => {
    resetGeneration.current += 1;
    appendInFlight.current = false;
    setCurrentStep('upload');
    setParsedData(null);
    setSelectedHeaderRow(0);
    setPreviewRows([]);
    setError(null);
    setSheetTarget(INITIAL_TARGET);
    setSelectedTab(null);
    setAppendStatus('idle');
    setAppendError(null);
  };

  return {
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
    handleTabSelect,
    handleAppend,
    handleStartOver,
  };
}
