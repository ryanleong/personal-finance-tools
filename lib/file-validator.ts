/**
 * File Validation Utility
 * Validates file content using magic bytes (file signatures)
 * This prevents file type confusion attacks
 */

export interface FileValidationResult {
  isValid: boolean;
  detectedType?: string;
  error?: string;
}

/**
 * Check if buffer starts with the given magic bytes
 */
function checkMagicBytes(buffer: Buffer, magicBytes: number[][]): boolean {
  return magicBytes.some(bytes => {
    if (buffer.length < bytes.length) return false;
    return bytes.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Validate CSV file content
 * CSV files are text-based, so we check for valid UTF-8 and text content
 */
function validateCSV(buffer: Buffer): FileValidationResult {
  try {
    // Check if it's valid UTF-8 text
    const text = buffer.toString('utf-8');

    // Basic validation: should have printable characters and typical CSV structure
    // Check for common CSV indicators (commas, newlines, quotes)
    const hasCommas = text.includes(',');
    const hasNewlines = /[\r\n]/.test(text);

    // Check for suspicious binary content in first 512 bytes
    const sample = buffer.slice(0, Math.min(512, buffer.length));
    let binaryCount = 0;
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      // Count non-printable characters (excluding common whitespace)
      if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
        binaryCount++;
      }
    }

    // If more than 10% of sample is binary, it's suspicious
    if (binaryCount > sample.length * 0.1) {
      return {
        isValid: false,
        error: 'File appears to contain binary data, not valid CSV text',
      };
    }

    // Should have CSV-like structure
    if (!hasCommas && !hasNewlines) {
      return {
        isValid: false,
        error: 'File does not appear to be a valid CSV format',
      };
    }

    return {
      isValid: true,
      detectedType: 'text/csv',
    };
  } catch {
    return {
      isValid: false,
      error: 'Unable to parse file as CSV text',
    };
  }
}

/**
 * Validate Excel file content using magic bytes
 */
function validateExcel(buffer: Buffer, extension: string): FileValidationResult {
  // Excel file magic bytes (file signatures)
  const xlsxMagicBytes = [
    [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP format, used by .xlsx)
    [0x50, 0x4B, 0x05, 0x06], // PK.. (Empty ZIP)
    [0x50, 0x4B, 0x07, 0x08], // PK.. (Spanned ZIP)
  ];

  const xlsMagicBytes = [
    [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // Old Excel format (.xls)
  ];

  if (extension === 'xlsx') {
    if (checkMagicBytes(buffer, xlsxMagicBytes)) {
      return {
        isValid: true,
        detectedType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
  } else if (extension === 'xls') {
    if (checkMagicBytes(buffer, xlsMagicBytes)) {
      return {
        isValid: true,
        detectedType: 'application/vnd.ms-excel',
      };
    }
  }

  return {
    isValid: false,
    error: `File content does not match expected ${extension.toUpperCase()} format`,
  };
}

/**
 * Main validation function - validates file content against its extension
 */
export function validateFileContent(
  buffer: Buffer,
  fileName: string
): FileValidationResult {
  const extension = fileName.toLowerCase().split('.').pop() || '';

  switch (extension) {
    case 'csv':
      return validateCSV(buffer);
    case 'xlsx':
    case 'xls':
      return validateExcel(buffer, extension);
    default:
      return {
        isValid: false,
        error: `Unsupported file type: ${extension}`,
      };
  }
}
