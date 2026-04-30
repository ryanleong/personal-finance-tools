import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RetirementCalculatorClient } from './components/RetirementCalculatorClient';

export const metadata: Metadata = {
  title: 'Retirement Calculator — Personal Finance Tools',
};

function LoadingShell() {
  return <div className="min-h-screen bg-[#080810]" />;
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <RetirementCalculatorClient />
    </Suspense>
  );
}
