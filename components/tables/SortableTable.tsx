'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  displayKey?: string;   // pre-computed display string field on the row
  hrefKey?: string;      // pre-computed href string field on the row
  sortable?: boolean;
}

interface Props<T extends object> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  rowKey: string;        // field name on T that holds the unique row ID
}

type SortDir = 'asc' | 'desc';

export function SortableTable<T extends object>({
  columns,
  data,
  pageSize = 50,
  rowKey,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-gray-600 ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  }`}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  {col.header}
                  {col.sortable && sortKey === String(col.key) && (
                    <span className="ml-1 text-gray-400">
                      {sortDir === 'asc' ? '\u2191' : '\u2193'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {pageData.map((row) => {
              const r = row as Record<string, unknown>;
              return (
                <tr key={String(r[rowKey] ?? '')} className="hover:bg-gray-50">
                  {columns.map((col) => {
                    const displayVal = String(
                      r[col.displayKey ?? String(col.key)] ?? ''
                    );
                    const href = col.hrefKey ? String(r[col.hrefKey] ?? '') : undefined;
                    return (
                      <td key={String(col.key)} className="px-4 py-3 text-gray-700">
                        {href ? (
                          <Link href={href} className="text-blue-600 hover:underline">
                            {displayVal}
                          </Link>
                        ) : (
                          displayVal
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * pageSize + 1}\u2013{Math.min(page * pageSize, sorted.length)} of{' '}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
            >
              \u2190 Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
            >
              Next \u2192
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
