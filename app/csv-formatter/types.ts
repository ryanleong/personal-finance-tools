export type Step = 'upload' | 'configure' | 'complete';

export interface ParsedFileData {
  headers: string[];
  rows: (string | number)[][];
  totalRows: number;
  fileName: string;
}
