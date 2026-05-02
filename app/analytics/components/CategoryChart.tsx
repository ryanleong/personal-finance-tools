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

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: CategoryBreakdown }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-[#16162a] border border-[#2a2a42] rounded-xl px-3.5 py-2.5 shadow-2xl">
      <p className="text-xs font-medium uppercase tracking-wide text-[#5a5a80] mb-1">{label}</p>
      <p className="text-base font-mono font-bold tabular-nums text-[#f0f0f8]">
        {formatSGDTooltip(value)}
      </p>
    </div>
  );
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
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
