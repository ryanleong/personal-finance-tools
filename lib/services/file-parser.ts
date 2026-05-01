/**
 * FileParserService - Handles parsing of uploaded CSV and Excel files
 * This service extracts raw data from file buffers and returns structured data
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: (string | number)[][];
  totalRows: number;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedData;
  error?: string;
}

/**
 * Parse CSV file buffer
 */
export function parseCSV(fileBuffer: Buffer): ParseResult {
  try {
    const csvString = fileBuffer.toString('utf-8');

    const result = Papa.parse(csvString, {
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      return {
        success: false,
        error: `CSV parsing error: ${result.errors[0].message}`,
      };
    }

    const allRows = result.data as (string | number)[][];

    if (allRows.length === 0) {
      return {
        success: false,
        error: 'CSV file is empty',
      };
    }

    // First row is treated as headers initially
    const headers = allRows[0].map(h => String(h));
    const rows = allRows.slice(1);

    return {
      success: true,
      data: {
        headers,
        rows,
        totalRows: rows.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse Excel file buffer (XLS, XLSX)
 */
export function parseExcel(fileBuffer: Buffer): ParseResult {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Read the first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        error: 'Excel file has no sheets',
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to array of arrays
    const allRows: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    });

    if (allRows.length === 0) {
      return {
        success: false,
        error: 'Excel sheet is empty',
      };
    }

    // First row is treated as headers initially
    const headers = allRows[0].map(h => String(h));
    const rows = allRows.slice(1);

    return {
      success: true,
      data: {
        headers,
        rows,
        totalRows: rows.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Main entry point - Parse file based on extension
 */
export function parseFile(fileBuffer: Buffer, fileName: string): ParseResult {
  const extension = fileName.toLowerCase().split('.').pop();

  switch (extension) {
    case 'csv':
      return parseCSV(fileBuffer);
    case 'xls':
    case 'xlsx':
      return parseExcel(fileBuffer);
    default:
      return {
        success: false,
        error: `Unsupported file type: ${extension}`,
      };
  }
}
