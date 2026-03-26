'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HistogramBin, histogramBins } from '@/lib/statistics';
import { formatCurrency } from '@/lib/format';

interface Props {
  values: number[];
  binCount?: number;
  color?: string;
  label?: string;
}

export function SalaryHistogram({
  values,
  binCount = 20,
  color = '#3b82f6',
  label = 'Employees',
}: Props) {
  const bins: HistogramBin[] = histogramBins(values, binCount);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={bins} margin={{ top: 4, right: 16, bottom: 24, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          angle={-30}
          textAnchor="end"
        />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [(value as number).toLocaleString(), label] as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(l: any) => `Starting at ${l as string}`}
        />
        <Bar dataKey="count" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
