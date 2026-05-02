'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CategoryBreakdown } from '../types';

interface CategoryChartProps {
  data: CategoryBreakdown[];
  color: string;
}

const formatSGDTooltip = (value: number) =>
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(value);

function yTickFormatter(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function CategoryChart({ data, color }: CategoryChartProps) {
  const hasMany = data.length > 4;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: hasMany ? 40 : 16 }}>
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={hasMany ? -30 : 0}
          textAnchor={hasMany ? 'end' : 'middle'}
        />
        <YAxis
          tickFormatter={yTickFormatter}
          tick={{ fontSize: 11 }}
          width={56}
        />
        <Tooltip
          formatter={(value) => [
            formatSGDTooltip(typeof value === 'number' ? value : Number(value)),
            'Amount',
          ]}
        />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
