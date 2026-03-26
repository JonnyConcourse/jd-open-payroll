'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/format';

interface Item {
  name: string;
  slug: string;
  medianSalary: number;
}

interface Props {
  data: Item[];
  highlightName: string;
}

export function TitleComparisonBar({ data, highlightName }: Props) {
  const sorted = [...data].sort((a, b) => b.medianSalary - a.medianSalary);

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, sorted.length * 30)}>
      <BarChart layout="vertical" data={sorted} margin={{ top: 4, right: 80, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={200} tickLine={false} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip formatter={(v: any) => [formatCurrency(v as number), 'Median Salary'] as any} />
        <Bar
          dataKey="medianSalary"
          radius={[0, 4, 4, 0]}
          label={{ position: 'right', formatter: ((v: number) => formatCurrency(v, true)) as unknown as (v: unknown) => string, fontSize: 10, fill: '#6b7280' }}
        >
          {sorted.map((entry, i) => (
            <Cell key={i} fill={entry.name === highlightName ? '#1d4ed8' : '#93c5fd'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
