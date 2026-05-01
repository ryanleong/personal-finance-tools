/**
 * FormatterService - Handles data transformation and formatting
 * This service contains the core business logic for processing financial data
 */

import { parse, format, isValid } from 'date-fns';

export interface ColumnMapping {
  dateColumn: number;
  descriptionColumns: number[];
  amountType: 'single' | 'split';
  amountColumn?: number; // For single column
  positiveIsIncome?: boolean; // For single column: true = positive is income, false = positive is expense
  creditColumn?: number; // For split
  debitColumn?: number; // For split
  headerRowIndex: number;
}

export interface FormattedRow {
  date: string;
  description: string;
  amount: number;
}

export interface FormatResult {
  success: boolean;
  data?: FormattedRow[];
  csvString?: string;
  error?: string;
}

/**
 * Auto-detect date format from a sample value
 * Tries common formats and returns the first match
 * Formats are ordered to prefer less ambiguous formats first
 */
function detectDateFormat(dateString: string): string | null {
  const trimmed = dateString.trim();

  // Prioritize unambiguous formats (ISO, year-first)
  const formats = [
    'yyyy-MM-dd',      // 2024-12-25 (ISO format - most unambiguous)
    'yyyy/MM/dd',      // 2024/12/25
    'dd MMM yyyy',     // 25 Dec 2024 (month name - unambiguous)
    'MMM dd, yyyy',    // Dec 25, 2024 (month name - unambiguous)
    'dd.MM.yyyy',      // 25.12.2024 (dots usually indicate DD.MM)
    'dd-MM-yyyy',      // 25-12-2024 (common in Europe)
    'dd/MM/yyyy',      // 25/12/2024 (common in Europe/Asia)
    'MM-dd-yyyy',      // 12-25-2024 (common in US)
    'MM/dd/yyyy',      // 12/25/2024 (common in US)
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(trimmed, fmt, new Date());

      // Additional validation: check if the parsed date makes sense
      if (isValid(parsed)) {
        // Verify the date is within a reasonable range (not too far in past/future)
        const year = parsed.getFullYear();
        const currentYear = new Date().getFullYear();

        // Financial data typically within past 50 years to next 10 years
        if (year >= currentYear - 50 && year <= currentYear + 10) {
          return fmt;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Parse and format date to DD/MM/YYYY
 */
function formatDate(dateValue: string | number): string | null {
  const dateString = String(dateValue).trim();

  if (!dateString) return null;

  const detectedFormat = detectDateFormat(dateString);
  if (!detectedFormat) return null;

  try {
    const parsed = parse(dateString, detectedFormat, new Date());
    if (!isValid(parsed)) return null;

    return format(parsed, 'dd/MM/yyyy');
  } catch {
    return null;
  }
}

/**
 * Remove newlines from a string value and replace with spaces
 * Protected against ReDoS with input length limit
 */
function removeNewlines(value: string): string {
  // Limit input length to prevent ReDoS attacks
  const MAX_LENGTH = 10000;
  if (value.length > MAX_LENGTH) {
    value = value.substring(0, MAX_LENGTH);
  }

  // Use simple, non-backtracking regex
  return value.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Clean currency value - remove symbols, commas, handle parentheses
 * Protected against ReDoS with input length limit
 */
function cleanCurrencyValue(value: string | number): number {
  if (typeof value === 'number') return value;

  let cleaned = String(value).trim();

  // Limit input length to prevent ReDoS attacks
  const MAX_LENGTH = 100; // Currency values shouldn't be longer than this
  if (cleaned.length > MAX_LENGTH) {
    return 0; // Invalid currency value
  }

  // Handle parentheses as negative (e.g., "(100)" -> -100)
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove currency symbols and commas - optimized regex
  // This character class doesn't have catastrophic backtracking
  cleaned = cleaned.replace(/[$£€¥,\s]/g, '');

  const num = parseFloat(cleaned);

  if (isNaN(num)) return 0;

  return isNegative ? -num : num;
}

/**
 * Format rows based on column mapping
 */
export function formatData(
  rows: (string | number)[][],
  mapping: ColumnMapping
): FormatResult {
  try {
    // Validate column indices before processing
    if (rows.length === 0) {
      return {
        success: false,
        error: 'No rows to format',
      };
    }

    // Get the number of columns from the first row
    const numColumns = rows[0]?.length || 0;

    // Validate date column
    if (mapping.dateColumn < 0 || mapping.dateColumn >= numColumns) {
      return {
        success: false,
        error: `Invalid date column index: ${mapping.dateColumn}. Must be between 0 and ${numColumns - 1}.`,
      };
    }

    // Validate description columns
    for (const colIndex of mapping.descriptionColumns) {
      if (colIndex < 0 || colIndex >= numColumns) {
        return {
          success: false,
          error: `Invalid description column index: ${colIndex}. Must be between 0 and ${numColumns - 1}.`,
        };
      }
    }

    // Validate amount columns based on type
    if (mapping.amountType === 'single') {
      if (mapping.amountColumn === undefined || mapping.amountColumn < 0 || mapping.amountColumn >= numColumns) {
        return {
          success: false,
          error: `Invalid amount column index: ${mapping.amountColumn}. Must be between 0 and ${numColumns - 1}.`,
        };
      }
    } else if (mapping.amountType === 'split') {
      if (mapping.creditColumn !== undefined && (mapping.creditColumn < 0 || mapping.creditColumn >= numColumns)) {
        return {
          success: false,
          error: `Invalid credit column index: ${mapping.creditColumn}. Must be between 0 and ${numColumns - 1}.`,
        };
      }
      if (mapping.debitColumn !== undefined && (mapping.debitColumn < 0 || mapping.debitColumn >= numColumns)) {
        return {
          success: false,
          error: `Invalid debit column index: ${mapping.debitColumn}. Must be between 0 and ${numColumns - 1}.`,
        };
      }
    }

    const formattedRows: FormattedRow[] = [];

    for (const row of rows) {
      // Parse date
      const dateValue = row[mapping.dateColumn];
      const formattedDate = formatDate(dateValue);

      if (!formattedDate) {
        // Skip rows with invalid dates
        continue;
      }

      // Join description columns and remove newlines
      const descriptionParts = mapping.descriptionColumns
        .map(colIndex => removeNewlines(String(row[colIndex] || '')))
        .filter(part => part.length > 0);
      const description = descriptionParts.join(' - ');

      // Calculate amount
      let amount: number;

      if (mapping.amountType === 'single' && mapping.amountColumn !== undefined) {
        amount = cleanCurrencyValue(row[mapping.amountColumn]);
        // If positive values mean expense (not income), flip the sign
        if (mapping.positiveIsIncome === false) {
          amount = -amount;
        }
      } else if (mapping.amountType === 'split') {
        const credit = mapping.creditColumn !== undefined
          ? cleanCurrencyValue(row[mapping.creditColumn])
          : 0;
        const debit = mapping.debitColumn !== undefined
          ? cleanCurrencyValue(row[mapping.debitColumn])
          : 0;

        // Positive = Credit, Negative = Debit
        amount = credit - debit;
      } else {
        amount = 0;
      }

      formattedRows.push({
        date: formattedDate,
        description,
        amount,
      });
    }

    // Generate CSV string
    const csvString = generateCSV(formattedRows);

    return {
      success: true,
      data: formattedRows,
      csvString,
    };
  } catch (error) {
    return {
      success: false,
      error: `Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Sanitize a value to prevent CSV injection attacks
 * If a cell starts with =, +, -, @, Tab, or Carriage Return, it could be interpreted as a formula
 */
function sanitizeForCSV(value: string): string {
  if (!value) return value;

  const trimmed = value.trim();

  // Check if the value starts with a dangerous character
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => trimmed.startsWith(char))) {
    // Prefix with single quote to prevent formula execution
    // Also prefix with tab to ensure Excel treats it as text
    return `'${value}`;
  }

  return value;
}

/**
 * Generate CSV string from formatted data
 * Output format: Date,Description,Amount (no commas in numbers)
 * Properly sanitizes all special characters for CSV compatibility
 */
function generateCSV(rows: FormattedRow[]): string {
  const header = 'Date,Category,Description,Amount';
  const lines = rows.map(row => {
    // Sanitize description to prevent CSV injection
    let description = removeNewlines(row.description);
    description = sanitizeForCSV(description);

    // Additional sanitization for special characters
    // Remove or replace problematic characters that might break CSV parsers
    description = description
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control characters
      .trim();

    // Escape quotes and wrap in quotes if needed
    // Always quote if contains comma, quote, newline, or starts with special char
    const needsQuoting = description.includes(',') ||
                         description.includes('"') ||
                         description.includes('\n') ||
                         description.startsWith("'");

    if (needsQuoting) {
      description = `"${description.replace(/"/g, '""')}"`;
    }

    // Format amount without commas - ensure it's a valid number
    const amount = Number.isFinite(row.amount) ? row.amount.toFixed(2) : '0.00';

    // Sanitize date to ensure it doesn't contain problematic characters
    const date = row.date.replace(/[^\d/\-.\s]/g, '');

    return `${date},,${description},${amount}`;
  });

  return [header, ...lines].join('\n');
}
