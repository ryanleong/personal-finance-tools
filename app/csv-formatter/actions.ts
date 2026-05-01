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
import { withTimeout } from '@/lib/timeout';

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
  csvString?: string;
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
 * Returns formatted CSV string
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

    if (!formatResult.success || !formatResult.csvString) {
      return {
        success: false,
        error: formatResult.error || 'Failed to format data',
      };
    }

    return {
      success: true,
      csvString: formatResult.csvString,
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
