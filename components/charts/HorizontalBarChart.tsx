'use client';

import { useRouter } from 'next/navigation';
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
import { formatCurrency, formatNumber } from '@/lib/format';

export interface HBarItem {
  name: string;
  value: number;
  href?: string;
}

interface Props {
  data: HBarItem[];
  valueLabel?: string;
  formatValue?: (v: number) => string;
  color?: string;
  height?: number;
}

export function HorizontalBarChart({
  data,
  valueLabel = 'Value',
  formatValue = formatNumber,
  color = '#3b82f6',
  height,
}: Props) {
  const router = useRouter();
  const h = height ?? Math.max(200, data.length * 36);

  function handleClick(item: HBarItem) {
    if (item.href) router.push(item.href);
  }

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 80, bottom: 4, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatValue} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          width={180}
          tickLine={false}
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip formatter={(v: any) => [formatValue(v as number), valueLabel] as any} />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={(item: unknown) => handleClick(item as HBarItem)}
          label={{ position: 'right', formatter: formatValue as unknown as (v: unknown) => string, fontSize: 11, fill: '#6b7280' }}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.href ? color : '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
