'use server';

/**
 * Server Actions - Bridge between UI and Service Layer
 * These actions handle file processing on the server side
 */

import { parseFile } from '@/lib/services/file-parser';
import { formatData, type ColumnMapping, type FormattedRow } from '@/lib/services/formatter';
import { validateFileContent } from '@/lib/file-validator';
import { uploadRateLimiter, processRateLimiter, getClientIP } from '@/lib/rate-limiter';
import { headers } from 'next/headers';
import { withTimeout, TimeoutError } from '@/lib/timeout';
import { createSheetsGateway, filterAllowedTabs, SheetsError, type SheetsErrorKind } from '@/lib/services/sheets';
import { toSheetRows } from '@/lib/services/sheet-rows';

export interface UploadResult {
  success: boolean;
  data?: {
    headers: string[];
    rows: (string | number)[][];
    totalRows: number;
    fileName: string;
  };
  error?: string;
}

export interface ProcessResult {
  success: boolean;
  data?: FormattedRow[];
  rowCount?: number;
  error?: string;
}

/**
 * Upload and parse a file
 * Returns parsed data for preview and column mapping
 */
export async function uploadFileAction(formData: FormData): Promise<UploadResult> {
  try {
    // Rate limiting check
    const headersList = await headers();
    const clientIP = getClientIP(headersList);

    if (!uploadRateLimiter.isAllowed(clientIP)) {
      const retryAfter = uploadRateLimiter.getRetryAfter(clientIP);
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      };
    }

    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Server-side file extension validation (cannot be bypassed)
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = '.' + file.name.toLowerCase().split('.').pop();

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        success: false,
        error: `Invalid file type. Only CSV, XLS, and XLSX files are allowed. You uploaded: ${fileExtension}`,
      };
    }

    // Validate file size (4MB limit)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        success: false,
        error: `File size exceeds the 4MB limit. Your file is ${fileSizeMB}MB.`,
      };
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content (magic bytes validation)
    const validation = validateFileContent(buffer, file.name);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Invalid file content',
      };
    }

    // Parse the file with timeout (max 30 seconds)
    const parseResult = await withTimeout(
      Promise.resolve(parseFile(buffer, file.name)),
      30000, // 30 seconds
      'File parsing timed out. The file may be too large or complex.'
    );

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        error: parseResult.error || 'Failed to parse file',
      };
    }

    return {
      success: true,
      data: {
        ...parseResult.data,
        fileName: file.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Process parsed data with column mapping
 * Returns formatted rows
 */
export async function processFileAction(
  rows: (string | number)[][],
  mapping: ColumnMapping & { headerRowIndex: number }
): Promise<ProcessResult> {
  try {
    // Rate limiting check
    const headersList = await headers();
    const clientIP = getClientIP(headersList);

    if (!processRateLimiter.isAllowed(clientIP)) {
      const retryAfter = processRateLimiter.getRetryAfter(clientIP);
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      };
    }

    // Validate headerRowIndex
    if (mapping.headerRowIndex < 0 || mapping.headerRowIndex > rows.length) {
      return {
        success: false,
        error: `Invalid header row index: ${mapping.headerRowIndex}. Must be between 0 and ${rows.length}.`,
      };
    }

    // Filter rows based on selected header row
    // Note: 'rows' array doesn't include the original row 0 (headers)
    // So if headerRowIndex=0, we want rows.slice(0) to start from the first data row
    const dataRows = rows.slice(mapping.headerRowIndex);

    if (dataRows.length === 0) {
      return {
        success: false,
        error: 'No data rows to process after header selection',
      };
    }

    // Format the data with timeout (max 60 seconds for processing)
    const formatResult = await withTimeout(
      Promise.resolve(formatData(dataRows, mapping)),
      60000, // 60 seconds
      'Data formatting timed out. The dataset may be too large or complex.'
    );

    if (!formatResult.success || !formatResult.data) {
      return {
        success: false,
        error: formatResult.error || 'Failed to format data',
      };
    }

    return {
      success: true,
      data: formatResult.data,
      rowCount: formatResult.data?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export interface SheetTargetResult {
  success: boolean;
  title?: string;
  tabs?: string[];
  tabGids?: Record<string, number>;
  sheetUrl?: string;
  error?: string;
}

export interface AppendResult {
  success: boolean;
  rowCount?: number;
  error?: string;
}

const MAX_APPEND_ROWS = 10000;
const APPEND_TIMEOUT_MS = 30000;

const SHEET_ERRORS: Record<SheetsErrorKind, string> = {
  forbidden:
    "The service account can't access this spreadsheet. Check it is shared with the service account as Editor.",
  'not-found': "That tab wasn't found. Reload the list and pick another.",
  'rate-limited': 'Google rate limit hit. Wait a minute and try again.',
  unavailable: 'Google is unavailable. Try again.',
  timeout:
    'The request timed out. Check the sheet before retrying, the rows may already have been added.',
  'not-configured': "Google Sheets isn't configured on the server.",
};

// Fixed messages only, so no raw error text (or sheet ID) reaches the client.
function sheetErrorMessage(error: unknown): string {
  if (error instanceof SheetsError) return SHEET_ERRORS[error.kind];
  if (error instanceof TimeoutError) return SHEET_ERRORS.timeout;
  return SHEET_ERRORS.unavailable;
}

/** Load the target spreadsheet's title and live tab names. */
export async function getSheetTargetAction(): Promise<SheetTargetResult> {
  try {
    const { title, tabs, tabGids } = await createSheetsGateway().listTabs();
    return {
      success: true,
      title,
      tabs: filterAllowedTabs(tabs, process.env.GOOGLE_SHEET_ALLOWED_TABS),
      tabGids,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}`,
    };
  } catch (error) {
    return { success: false, error: sheetErrorMessage(error) };
  }
}

/** Append formatted rows to an existing tab of the target spreadsheet. */
export async function appendToSheetAction(
  tab: string,
  rows: FormattedRow[]
): Promise<AppendResult> {
  try {
    const clientIP = getClientIP(await headers());
    if (!processRateLimiter.isAllowed(clientIP)) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${processRateLimiter.getRetryAfter(clientIP)} seconds.`,
      };
    }

    if (rows.length > MAX_APPEND_ROWS) {
      return {
        success: false,
        error: `Too many rows (${rows.length}). The limit is 10,000 rows per append.`,
      };
    }

    const gateway = createSheetsGateway();
    const { tabs } = await gateway.listTabs();
    if (!filterAllowedTabs(tabs, process.env.GOOGLE_SHEET_ALLOWED_TABS).includes(tab)) return { success: false, error: SHEET_ERRORS['not-found'] };

    await withTimeout(gateway.appendRows(tab, toSheetRows(rows)), APPEND_TIMEOUT_MS);
    return { success: true, rowCount: rows.length };
  } catch (error) {
    return { success: false, error: sheetErrorMessage(error) };
  }
}
