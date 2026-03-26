'use client';

import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface BoxStats {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  label: string;
}

interface CustomBoxProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: BoxStats;
  value?: number[];
}

function BoxShape(props: CustomBoxProps) {
  const { x = 0, y = 0, width = 0, payload } = props;
  if (!payload) return null;

  const { min, p25, median: med, p75, max } = payload;

  // We need to map salary values to pixel coords using the chart's scale.
  // Since we can't access YAxis scale directly in a custom shape, we pass values
  // as a [min, max] array and rely on the bar's y/height for p25→p75 range.
  // Instead, render as a static SVG overlay using the bar props.
  // The bar's y = p75 pixel position, y+height = p25 pixel position (inverted).
  const boxTop = y; // p75
  const boxBottom = y + (props.height ?? 0); // p25
  const boxHeight = boxBottom - boxTop;
  const cx = x + width / 2;

  // Compute median line position within the box
  const range = p75 - p25 || 1;
  const medY = boxTop + ((p75 - med) / range) * boxHeight;

  return (
    <g>
      {/* IQR box */}
      <rect x={x + 8} y={boxTop} width={width - 16} height={boxHeight} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={2} rx={2} />
      {/* Median line */}
      <line x1={x + 8} x2={x + width - 8} y1={medY} y2={medY} stroke="#1d4ed8" strokeWidth={2.5} />
      {/* Upper whisker (p75 → max) - drawn above box */}
      <line x1={cx} x2={cx} y1={boxTop - 20} y2={boxTop} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="3 2" />
      {/* Lower whisker (p25 → min) - drawn below box */}
      <line x1={cx} x2={cx} y1={boxBottom} y2={boxBottom + 20} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="3 2" />
    </g>
  );
}

interface Props {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  label?: string;
}

export function SalaryBoxPlot({ min, p25, median: med, p75, max, label = 'Salary Range' }: Props) {
  const data = [{ label, min, p25, median: med, p75, max, range: [p25, p75] as [number, number] }];

  return (
    <div className="flex flex-col gap-3">
      {/* Simple stat display since a true box plot requires D3-level control */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { label: 'Min', value: min },
          { label: '25th %ile', value: p25 },
          { label: 'Median', value: med },
          { label: '75th %ile', value: p75 },
          { label: 'Max', value: max },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-600 font-medium">{s.label}</p>
            <p className="text-sm font-bold text-blue-900 tabular-nums">{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Visual box plot using a horizontal bar */}
      <div className="relative h-12 rounded-lg bg-gray-100 overflow-hidden">
        {/* Background range: min to max */}
        <div
          className="absolute top-0 bottom-0 bg-gray-200"
          style={{
            left: '0%',
            right: '0%',
          }}
        />
        {/* IQR box: p25 to p75 */}
        <div
          className="absolute top-2 bottom-2 bg-blue-300 border-2 border-blue-500 rounded"
          style={{
            left: `${((p25 - min) / (max - min || 1)) * 100}%`,
            right: `${((max - p75) / (max - min || 1)) * 100}%`,
          }}
        />
        {/* Median line */}
        <div
          className="absolute top-1 bottom-1 w-0.5 bg-blue-700"
          style={{
            left: `${((med - min) / (max - min || 1)) * 100}%`,
          }}
        />
        {/* Min whisker */}
        <div className="absolute top-4 bottom-4 w-0.5 bg-gray-500" style={{ left: '0%' }} />
        {/* Max whisker */}
        <div className="absolute top-4 bottom-4 w-0.5 bg-gray-500" style={{ right: '0%' }} />
        {/* Min-to-p25 line */}
        <div
          className="absolute top-1/2 h-px bg-gray-400"
          style={{
            left: '0%',
            right: `${((max - p25) / (max - min || 1)) * 100}%`,
          }}
        />
        {/* p75-to-max line */}
        <div
          className="absolute top-1/2 h-px bg-gray-400"
          style={{
            left: `${((p75 - min) / (max - min || 1)) * 100}%`,
            right: '0%',
          }}
        />
      </div>
    </div>
  );
}
