'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PayBreakdown } from '@/types/payroll';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: { label: string; breakdown: PayBreakdown }[];
}

const COLORS: Record<keyof PayBreakdown, string> = {
  regularPay: '#3b82f6',
  overtimePay: '#f59e0b',
  supplementalPay: '#10b981',
  oneTimePayments: '#8b5cf6',
  lumpSumPay: '#ec4899',
  retroactivePay: '#06b6d4',
  clothingPay: '#84cc16',
  cashInLieu: '#f97316',
};

const LABELS: Record<keyof PayBreakdown, string> = {
  regularPay: 'Regular Pay',
  overtimePay: 'Overtime',
  supplementalPay: 'Supplemental',
  oneTimePayments: 'One-Time',
  lumpSumPay: 'Lump Sum',
  retroactivePay: 'Retroactive',
  clothingPay: 'Clothing/Uniform',
  cashInLieu: 'Cash in Lieu',
};

export function PayBreakdownChart({ data }: Props) {
  const chartData = data.map(({ label, breakdown }) => ({
    name: label,
    ...breakdown,
  }));

  const activeKeys = (Object.keys(LABELS) as (keyof PayBreakdown)[]).filter((k) =>
    data.some((d) => (d.breakdown[k] ?? 0) > 0)
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 11 }} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip formatter={(v: any, name: any) => [formatCurrency(v as number), name as string] as any} />
        <Legend formatter={(v) => LABELS[v as keyof PayBreakdown] ?? v} />
        {activeKeys.map((k) => (
          <Bar key={k} dataKey={k} name={k} stackId="a" fill={COLORS[k]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
