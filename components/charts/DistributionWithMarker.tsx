'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { histogramBins } from '@/lib/statistics';
import { formatCurrency } from '@/lib/format';

interface Props {
  values: number[];
  markerValue: number;
  markerLabel?: string;
  binCount?: number;
}

export function DistributionWithMarker({
  values,
  markerValue,
  markerLabel = 'This Employee',
  binCount = 20,
}: Props) {
  const bins = histogramBins(values, binCount);
  if (bins.length === 0) return <p className="text-sm text-gray-400">Insufficient data</p>;

  // Find the bin that contains the markerValue for reference line x position
  const bin = bins.find((b) => markerValue >= b.rangeStart && markerValue <= b.rangeEnd);
  const markerX = bin?.label ?? null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={bins} margin={{ top: 4, right: 16, bottom: 24, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          angle={-30}
          textAnchor="end"
        />
        <YAxis tick={{ fontSize: 11 }} width={36} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [(v as number).toLocaleString(), 'Employees'] as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(l: any) => `Starting at ${l as string}`}
        />
        <Bar dataKey="count" fill="#93c5fd" radius={[2, 2, 0, 0]} />
        {markerX && (
          <ReferenceLine
            x={markerX}
            stroke="#dc2626"
            strokeWidth={2}
            label={{ value: markerLabel, position: 'top', fontSize: 10, fill: '#dc2626' }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
