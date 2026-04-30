import type { Metadata } from 'next';
import { RetirementCalculator } from './components/RetirementCalculator';

export const metadata: Metadata = {
  title: 'Retirement Calculator — Personal Finance Tools',
};

export default function Page() {
  return <RetirementCalculator />;
}
