'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SearchResult } from '@/types/payroll';

const TYPE_ICON: Record<SearchResult['type'], string> = {
  agency: '🏛',
  title: '💼',
  employee: '👤',
};

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data: SearchResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          placeholder="Search agencies, titles, or employees…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {loading ? (
          <span className="absolute right-3 top-2.5 text-gray-400 text-xs">…</span>
        ) : (
          <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <Link
              key={i}
              href={r.href}
              onClick={() => { setOpen(false); setQuery(''); }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{TYPE_ICON[r.type]}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                <p className="text-xs text-gray-500">{r.sublabel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg p-4 text-sm text-gray-500">
          No results for "{query}"
        </div>
      )}
    </div>
  );
}
