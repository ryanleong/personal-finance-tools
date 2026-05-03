import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
}

const dateFormatter = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  maximumFractionDigits: 2,
});

function formatDate(d: Date): string {
  return (
    String(d.getDate()).padStart(2, '0') +
    '/' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '/' +
    d.getFullYear()
  );
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="text-sm opacity-50 py-2">No transactions.</p>;
  }

  const sorted = transactions.slice().sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="pt-1 pb-2">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left font-medium opacity-50 pb-1.5 pr-3">Date</th>
            <th className="text-left font-medium opacity-50 pb-1.5 pr-3">Notes</th>
            <th className="text-left font-medium opacity-50 pb-1.5 pr-3">Account</th>
            <th className="text-right font-medium opacity-50 pb-1.5">Amount (SGD)</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tx, i) => (
            <tr key={i} className="border-t border-border/50">
              <td className="py-1.5 pr-3">{formatDate(tx.date)}</td>
              <td className="py-1.5 pr-3 max-w-[200px] truncate">{tx.notes}</td>
              <td className="py-1.5 pr-3">{tx.account}</td>
              <td className="py-1.5 text-right tabular-nums">
                {dateFormatter.format(Math.abs(tx.amountSGD))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
