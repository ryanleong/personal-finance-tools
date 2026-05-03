import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AnalyticsClient } from './components/AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics â€” Personal Finance Tools',
};

function LoadingShell() {
  return <div className="min-h-screen bg-background" />;
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <AnalyticsClient />
    </Suspense>
  );
}
