'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DataPreviewProps {
  headers: string[];
  rows: (string | number)[][];
  onHeaderRowSelect: (rowIndex: number) => void;
  selectedHeaderRow?: number;
}

export function DataPreview({
  headers,
  rows,
  onHeaderRowSelect,
  selectedHeaderRow = 0
}: DataPreviewProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Show first 15 rows for preview
  const previewRows = rows.slice(0, 15);

  // Combine headers and rows for display
  const allRows = [headers, ...previewRows];

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Data Preview</CardTitle>
            <CardDescription className="mt-1.5 text-muted-foreground">
              Click on a row to set it as the header row. All rows above will be excluded.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-background text-muted-foreground border-border">
            Showing {previewRows.length} of {rows.length} rows
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableBody>
              {allRows.map((row, rowIndex) => {
                const isSelected = rowIndex === selectedHeaderRow;
                const isHovered = rowIndex === hoveredRow;

                return (
                  <TableRow
                    key={rowIndex}
                    className={clsx(
                      'cursor-pointer transition-colors border-border',
                      isSelected
                        ? 'bg-blue-900/30 border-l-4 border-l-blue-400 hover:bg-blue-900/40'
                        : isHovered
                          ? 'bg-[#14142a]'
                          : 'hover:bg-[#14142a]',
                    )}
                    onClick={() => onHeaderRowSelect(rowIndex)}
                    onMouseEnter={() => setHoveredRow(rowIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <TableCell className="w-16 bg-background text-center font-mono text-xs text-muted-foreground p-2 border-r border-border">
                      <div className="flex items-center justify-center gap-2">
                        {isSelected ? (
                          <Check className="w-3 h-3 text-blue-400" />
                        ) : (
                          <span>{rowIndex}</span>
                        )}
                      </div>
                    </TableCell>

                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className={clsx(
                          'whitespace-nowrap max-w-xs truncate p-4',
                          isSelected ? 'font-medium text-foreground' : 'text-foreground'
                        )}
                        title={String(cell)}
                      >
                        {String(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <div className="p-4 border-t border-border bg-background/50 text-sm text-muted-foreground flex justify-end">
        <p>
          <span className="font-medium text-blue-400">Row {selectedHeaderRow}</span> selected as header
        </p>
      </div>
    </Card>
  );
}
