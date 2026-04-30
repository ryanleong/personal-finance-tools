'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { DataPoint, CPFPayoutLevel } from '../types';

interface RetirementChartProps {
  dataPoints: DataPoint[];
  isSuccessful: boolean;
  retirementAge: number;
  currentAge: number;
  endAge: number;
  cpfPayoutLevel: CPFPayoutLevel;
}

const LINE_COLOR_SUCCESS = '#00e5a0';
const LINE_COLOR_FAIL = '#ff3b5c';

function formatYAxis(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTooltipBalance(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000)
    return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString('en-US')}`;
}

interface TooltipPayload {
  payload?: DataPoint;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const { age, balance } = payload[0].payload;
  const isNegative = balance < 0;

  return (
    <div className="bg-[#16162a] border border-[#2a2a42] rounded-xl px-3.5 py-2.5 shadow-2xl">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-[#5a5a80] mb-1">
        Age {age}
      </p>
      <p
        className="text-sm font-mono font-bold tabular-nums"
        style={{ color: isNegative ? LINE_COLOR_FAIL : '#f0f0f8' }}
      >
        {formatTooltipBalance(balance)}
      </p>
    </div>
  );
}

export function RetirementChart({
  dataPoints,
  isSuccessful,
  retirementAge,
  currentAge,
  endAge,
  cpfPayoutLevel,
}: RetirementChartProps) {
  const lineColor = isSuccessful ? LINE_COLOR_SUCCESS : LINE_COLOR_FAIL;

  // X-axis ticks: every 5 years from the first multiple of 5 >= currentAge
  const firstTick = Math.ceil(currentAge / 5) * 5;
  const xTicks: number[] = [];
  for (let age = firstTick; age <= endAge; age += 5) {
    xTicks.push(age);
  }

  // Show CPF reference line only when retirement is before 65 and CPF is selected
  const showCpfLine = cpfPayoutLevel !== 'none' && retirementAge < 65;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={dataPoints}
        margin={{ top: 24, right: 24, bottom: 8, left: 8 }}
      >
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1c1c30"
          vertical={false}
        />

        <XAxis
          dataKey="age"
          ticks={xTicks}
          tick={{ fill: '#5a5a80', fontSize: 11, fontFamily: 'var(--font-jetbrains, monospace)' }}
          axisLine={{ stroke: '#1c1c30' }}
          tickLine={false}
          label={{
            value: 'Age',
            position: 'insideBottomRight',
            fill: '#40405a',
            fontSize: 10,
            offset: -4,
          }}
        />

        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: '#5a5a80', fontSize: 11, fontFamily: 'var(--font-jetbrains, monospace)' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />

        <Tooltip content={<ChartTooltip />} />

        {/* Zero baseline */}
        <ReferenceLine y={0} stroke="#2a2a42" strokeWidth={1} />

        {/* Retirement age marker */}
        <ReferenceLine
          x={retirementAge}
          stroke="#ff2d78"
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{
            value: `Retire @ ${retirementAge}`,
            fill: '#ff2d78',
            fontSize: 10,
            position: 'insideTopRight',
            fontFamily: 'var(--font-jetbrains, monospace)',
          }}
        />

        {/* CPF start marker — only when retirement is before 65 */}
        {showCpfLine && (
          <ReferenceLine
            x={65}
            stroke="#ffb340"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: 'CPF @ 65',
              fill: '#ffb340',
              fontSize: 10,
              position: 'insideTopRight',
              fontFamily: 'var(--font-jetbrains, monospace)',
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="balance"
          stroke={lineColor}
          strokeWidth={2}
          fill="url(#portfolioGradient)"
          dot={false}
          activeDot={{ r: 5, fill: lineColor, stroke: '#080810', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
