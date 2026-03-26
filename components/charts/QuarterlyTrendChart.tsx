'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { QuarterlyPoint } from '@/types/payroll';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: QuarterlyPoint[];
  metric?: 'totalPayroll' | 'headcount';
}

export function QuarterlyTrendChart({ data, metric = 'totalPayroll' }: Props) {
  const fmt = metric === 'totalPayroll'
    ? (v: number) => formatCurrency(v, true)
    : (v: number) => v.toLocaleString();

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip formatter={(v: any) => [fmt(v as number), metric === 'totalPayroll' ? 'Total Payroll' : 'Headcount'] as any} />
        <Line
          type="monotone"
          dataKey={metric}
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
