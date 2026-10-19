import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCsvFormatterData } from './useCsvFormatterData';
import * as actions from '../actions';

vi.mock('../actions', () => ({
  uploadFileAction: vi.fn(),
  processFileAction: vi.fn(),
  getSheetTargetAction: vi.fn(),
  appendToSheetAction: vi.fn(),
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
    localStorage.clear();
    vi.mocked(actions.getSheetTargetAction).mockResolvedValue({ success: true, title: 'T', tabs: [] });
  });

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useCsvFormatterData());

    expect(result.current.currentStep).toBe('upload');
    expect(result.current.parsedData).toBeNull();
    expect(result.current.selectedHeaderRow).toBe(0);
    expect(result.current.isProcessing).toBe(false);
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
    expect(result.current.error).toBe('Failed to process file');
    expect(result.current.isProcessing).toBe(false);
  });

  describe('sheet append', () => {
    const rows = [
      { date: '01/01/2024', description: 'A', amount: -1 },
      { date: '02/01/2024', description: 'B', amount: 2 },
    ];

    async function reachComplete() {
      vi.mocked(actions.uploadFileAction).mockResolvedValue({ success: true, data: mockParsedData });
      vi.mocked(actions.processFileAction).mockResolvedValue({ success: true, data: rows });
      const hook = renderHook(() => useCsvFormatterData());
      await act(async () => {
        await hook.result.current.handleFileSelect(new File([''], 'test.csv'));
      });
      await act(async () => {
        await hook.result.current.handleMappingComplete(mockMapping);
      });
      return hook;
    }

    beforeEach(() => {
      vi.mocked(actions.getSheetTargetAction).mockResolvedValue({
        success: true,
        title: 'Budget',
        tabs: ['Jan', 'Feb'],
        sheetUrl: 'https://sheet',
      });
    });

    it('loads the sheet target on entering the complete step', async () => {
      const { result } = await reachComplete();

      expect(result.current.sheetTarget).toEqual({
        status: 'ready',
        title: 'Budget',
        tabs: ['Jan', 'Feb'],
        sheetUrl: 'https://sheet',
      });
      expect(result.current.selectedTab).toBeNull();
    });

    it('reports an error status when the target fails to load', async () => {
      vi.mocked(actions.getSheetTargetAction).mockResolvedValue({ success: false, error: 'nope' });
      const { result } = await reachComplete();

      expect(result.current.sheetTarget.status).toBe('error');
    });

    it('restores the last tab only if it is in the list', async () => {
      localStorage.setItem('csv-formatter:last-tab', 'Feb');
      const first = await reachComplete();
      expect(first.result.current.selectedTab).toBe('Feb');
      first.unmount();

      localStorage.setItem('csv-formatter:last-tab', 'Gone');
      const second = await reachComplete();
      expect(second.result.current.selectedTab).toBeNull();
    });

    it('remembers a selected tab for next time', async () => {
      const { result } = await reachComplete();
      act(() => result.current.handleTabSelect('Jan'));

      expect(result.current.selectedTab).toBe('Jan');
      expect(localStorage.getItem('csv-formatter:last-tab')).toBe('Jan');
    });

    it('appends the full formatted rows and ends in done', async () => {
      vi.mocked(actions.appendToSheetAction).mockResolvedValue({ success: true, rowCount: 2 });
      const { result } = await reachComplete();
      act(() => result.current.handleTabSelect('Jan'));
      await act(async () => {
        await result.current.handleAppend();
      });

      expect(actions.appendToSheetAction).toHaveBeenCalledWith('Jan', rows);
      expect(result.current.appendStatus).toBe('done');
    });

    it('ignores further appends after success', async () => {
      vi.mocked(actions.appendToSheetAction).mockResolvedValue({ success: true, rowCount: 2 });
      const { result } = await reachComplete();
      act(() => result.current.handleTabSelect('Jan'));
      await act(async () => {
        await result.current.handleAppend();
      });
      await act(async () => {
        await result.current.handleAppend();
      });

      expect(actions.appendToSheetAction).toHaveBeenCalledTimes(1);
    });

    it('keeps rows on failure and allows retry', async () => {
      vi.mocked(actions.appendToSheetAction)
        .mockResolvedValueOnce({ success: false, error: 'Google is unavailable. Try again.' })
        .mockResolvedValueOnce({ success: true, rowCount: 2 });
      const { result } = await reachComplete();
      act(() => result.current.handleTabSelect('Jan'));
      await act(async () => {
        await result.current.handleAppend();
      });

      expect(result.current.appendStatus).toBe('error');
      expect(result.current.appendError).toBe('Google is unavailable. Try again.');
      expect(result.current.previewRows).toEqual(rows);

      await act(async () => {
        await result.current.handleAppend();
      });
      expect(result.current.appendStatus).toBe('done');
      expect(result.current.appendError).toBeNull();
    });

    it('sends only one request for a double click', async () => {
      vi.mocked(actions.appendToSheetAction).mockResolvedValue({ success: true, rowCount: 2 });
      const { result } = await reachComplete();
      act(() => result.current.handleTabSelect('Jan'));
      await act(async () => {
        await Promise.all([result.current.handleAppend(), result.current.handleAppend()]);
      });

      expect(actions.appendToSheetAction).toHaveBeenCalledTimes(1);
    });

    it('ignores a late append result after start over', async () => {
      let finish!: (r: { success: boolean; rowCount: number }) => void;
      vi.mocked(actions.appendToSheetAction).mockReturnValue(new Promise((res) => (finish = res)));
      const { result } = await reachComplete();
      act(() => result.current.handleTabSelect('Jan'));
      let pending!: Promise<void>;
      act(() => {
        pending = result.current.handleAppend();
      });
      act(() => result.current.handleStartOver());
      await act(async () => {
        finish({ success: true, rowCount: 2 });
        await pending;
      });

      expect(result.current.appendStatus).toBe('idle');
    });

    it('resets append state on start over', async () => {
      vi.mocked(actions.appendToSheetAction).mockResolvedValue({ success: true, rowCount: 2 });
      const { result } = await reachComplete();
      act(() => result.current.handleTabSelect('Jan'));
      await act(async () => {
        await result.current.handleAppend();
      });
      act(() => result.current.handleStartOver());

      expect(result.current.appendStatus).toBe('idle');
      expect(result.current.appendError).toBeNull();
      expect(result.current.selectedTab).toBeNull();
      expect(result.current.sheetTarget.status).toBe('loading');
      expect(result.current.previewRows).toEqual([]);
    });
  });
});
