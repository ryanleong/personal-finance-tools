import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CsvFormatterClient } from './components/CsvFormatterClient';

export const metadata: Metadata = {
  title: 'CSV Formatter — Personal Finance Tools',
};

function LoadingShell() {
  return <div className="min-h-screen bg-[var(--color-app-bg)]" />;
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <CsvFormatterClient />
    </Suspense>
  );
}

