'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  years: number[];
  current: number;
}

export function YearSelector({ years, current }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set('year', e.target.value);
    router.push(`?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-600">Year</label>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
