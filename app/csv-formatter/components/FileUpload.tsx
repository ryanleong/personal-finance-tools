'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
}

export function FileUpload({
  onFileSelect,
  acceptedFormats = ['.csv', '.xls', '.xlsx']
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelection = useCallback((file: File) => {
    const extension = '.' + file.name.toLowerCase().split('.').pop();

    if (!acceptedFormats.includes(extension)) {
      alert(`Invalid file type. Please upload: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Check file size (4MB limit)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`File too large. Maximum size is 4MB, but your file is ${fileSizeMB}MB.`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [acceptedFormats, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  }, [handleFileSelection]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  }, [handleFileSelection]);

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card
        className={clsx(
          'relative border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer bg-[var(--color-app-surface)]',
          isDragging
            ? 'border-blue-400 bg-[var(--color-app-surface)] scale-[1.01]'
            : 'border-[var(--color-app-border)] hover:border-blue-400/50 hover:bg-[var(--color-app-surface)]'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
          {selectedFile ? (
            <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3 bg-green-900/30 border border-green-700/50 p-4 rounded-xl w-full max-w-md">
                <div className="p-2 bg-green-900/50 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-green-400 shrink-0" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-green-100 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-green-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="hover:bg-green-900/50 hover:text-green-300 shrink-0 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-[#a0a0b8]">
                File selected successfully. Click below to choose a different file.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--color-app-surface)] text-[var(--color-app-text)] rounded-full w-fit mx-auto border border-[var(--color-app-border)]">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight text-[var(--color-app-text)]">
                  Upload Your Transaction File
                </h3>
                <p className="text-[#a0a0b8] text-sm">
                  Drag and drop your file here, or click to browse
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {acceptedFormats.map((format) => (
                  <span
                    key={format}
                    className="inline-flex items-center rounded-md border border-[var(--color-app-border)] px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-app-surface)] text-[var(--color-app-text)]"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="File upload"
          />
        </CardContent>
      </Card>

      <div className="text-center text-sm text-[#a0a0b8]">
        <p>Your file will be processed securely on the server</p>
      </div>
    </div>
  );
}
