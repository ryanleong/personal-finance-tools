'use client';

import { useState, useRef } from 'react';
import { Upload, ChevronDown } from 'lucide-react';

interface UploadSectionProps {
  isLoaded: boolean;
  onFileSelect: (file: File) => void;
  error: string | null;
}

export function UploadSection({ isLoaded, onFileSelect, error }: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  const dropZone = (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10',
        'bg-card border-border',
        'transition-colors duration-150',
        isDragOver
          ? 'border-primary bg-primary/10'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Upload className="w-8 h-8 opacity-50" />
      <div className="text-center">
        <p className="text-sm font-medium">Drag and drop your CSV here</p>
        <p className="text-xs opacity-50 mt-1">or</p>
      </div>
      <button
        type="button"
        onClick={handleBrowseClick}
        className="px-4 py-2 text-sm font-medium rounded-md bg-card border border-border hover:opacity-80 transition-opacity"
      >
        Browse file
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );

  if (isLoaded) {
    return (
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        {/* Collapsed bar */}
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <span>CSV loaded. Replace file?</span>
          <ChevronDown
            className={`w-4 h-4 opacity-60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Expandable drop zone */}
        {isExpanded && (
          <div className="px-4 pb-4">
            {dropZone}
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {dropZone}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
