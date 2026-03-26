'use client';

import { useRouter } from 'next/navigation';
import { ResponsiveContainer, Treemap } from 'recharts';
import { formatCurrency } from '@/lib/format';

export interface TreemapItem {
  name: string;
  value: number; // totalPayroll
  href?: string;
}

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  href?: string;
}

const COLORS = [
  '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#1e40af', '#1e3a8a', '#172554', '#0369a1', '#0284c7',
];

function CustomContent(props: CustomContentProps & { index?: number; onClick: (item: TreemapItem) => void }) {
  const { x = 0, y = 0, width = 0, height = 0, name, value, href, index = 0, onClick } = props;
  const color = COLORS[index % COLORS.length];
  if (width < 30 || height < 20) return null;

  return (
    <g
      style={{ cursor: href ? 'pointer' : 'default' }}
      onClick={() => name && value !== undefined && onClick({ name, value, href })}
    >
      <rect x={x} y={y} width={width} height={height} fill={color} stroke="#fff" strokeWidth={2} rx={4} />
      {width > 60 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (height > 50 ? 8 : 0)}
            textAnchor="middle"
            fill="#fff"
            fontSize={Math.min(13, width / 8)}
            fontWeight={600}
          >
            {name && name.length > 20 ? name.slice(0, 19) + '…' : name}
          </text>
          {height > 50 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize={11}
            >
              {formatCurrency(value ?? 0, true)}
            </text>
          )}
        </>
      )}
    </g>
  );
}

interface Props {
  data: TreemapItem[];
}

export function PayrollTreemap({ data }: Props) {
  const router = useRouter();

  function handleClick(item: TreemapItem) {
    if (item.href) router.push(item.href);
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data={sorted as any}
        dataKey="value"
        aspectRatio={4 / 3}
        content={(props: Record<string, unknown>) => (
          <CustomContent
            {...(props as CustomContentProps)}
            index={sorted.findIndex((d) => d.name === props.name)}
            onClick={handleClick}
          />
        )}
      />
    </ResponsiveContainer>
  );
}
