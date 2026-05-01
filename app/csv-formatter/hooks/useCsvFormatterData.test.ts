import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCsvFormatterData } from './useCsvFormatterData';
import * as actions from '../actions';

vi.mock('../actions', () => ({
  uploadFileAction: vi.fn(),
  processFileAction: vi.fn(),
}));

const mockParsedData = {
  headers: ['Date', 'Description', 'Amount'],
  rows: [['2024-01-01', 'Test', '100']],
  totalRows: 1,
  fileName: 'test.csv',
};

const mockMapping = {
  dateColumn: 0,
  descriptionColumns: [1],
  amountType: 'single' as const,
  amountColumn: 2,
};

describe('useCsvFormatterData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useCsvFormatterData());

    expect(result.current.currentStep).toBe('upload');
    expect(result.current.parsedData).toBeNull();
    expect(result.current.selectedHeaderRow).toBe(0);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.processedCSV).toBeNull();
    expect(result.current.previewRows).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.mappingHeaders).toEqual([]);
  });

  it('transitions to configure and sets parsedData on successful upload', async () => {
    vi.mocked(actions.uploadFileAction).mockResolvedValue({
      success: true,
      data: mockParsedData,
    });

    const { result } = renderHook(() => useCsvFormatterData());

    await act(async () => {
      await result.current.handleFileSelect(new File([''], 'test.csv'));
    });

    expect(result.current.currentStep).toBe('configure');
    expect(result.current.parsedData).toEqual(mockParsedData);
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('sets error and stays on upload step on failed upload', async () => {
    vi.mocked(actions.uploadFileAction).mockResolvedValue({
      success: false,
      error: 'Failed to parse file',
    });

    const { result } = renderHook(() => useCsvFormatterData());

    await act(async () => {
      await result.current.handleFileSelect(new File([''], 'test.csv'));
    });

    expect(result.current.currentStep).toBe('upload');
    expect(result.current.parsedData).toBeNull();
    expect(result.current.error).toBe('Failed to parse file');
    expect(result.current.isProcessing).toBe(false);
  });

  it('updates selectedHeaderRow', () => {
    const { result } = renderHook(() => useCsvFormatterData());

    act(() => {
      result.current.handleHeaderRowSelect(2);
    });

    expect(result.current.selectedHeaderRow).toBe(2);
  });

  it('transitions to complete on successful processing', async () => {
    vi.mocked(actions.uploadFileAction).mockResolvedValue({
      success: true,
      data: mockParsedData,
    });
    vi.mocked(actions.processFileAction).mockResolvedValue({
      success: true,
      csvString: 'date,description,amount',
      data: [],
    });

    const { result } = renderHook(() => useCsvFormatterData());

    await act(async () => {
      await result.current.handleFileSelect(new File([''], 'test.csv'));
    });

    await act(async () => {
      await result.current.handleMappingComplete(mockMapping);
    });

    expect(result.current.currentStep).toBe('complete');
    expect(result.current.processedCSV).toBe('date,description,amount');
    expect(result.current.previewRows).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('sets error and stays on configure step on failed processing', async () => {
    vi.mocked(actions.uploadFileAction).mockResolvedValue({
      success: true,
      data: mockParsedData,
    });
    vi.mocked(actions.processFileAction).mockResolvedValue({
      success: false,
      error: 'Failed to process file',
    });

    const { result } = renderHook(() => useCsvFormatterData());

    await act(async () => {
      await result.current.handleFileSelect(new File([''], 'test.csv'));
    });

    await act(async () => {
      await result.current.handleMappingComplete(mockMapping);
    });

    expect(result.current.currentStep).toBe('configure');
    expect(result.current.processedCSV).toBeNull();
    expect(result.current.error).toBe('Failed to process file');
    expect(result.current.isProcessing).toBe(false);
  });
});
