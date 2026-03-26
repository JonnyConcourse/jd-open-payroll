import Link from 'next/link';
import { SearchBar } from './SearchBar';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold text-blue-700">Open</span>
          <span className="text-xl font-bold text-gray-900">Payroll</span>
          <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">NJ</span>
        </Link>
        <div className="flex-1">
          <SearchBar />
        </div>
        <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-700">Overview</Link>
          <a
            href="https://data.nj.gov/Government-Finance/YourMoney-Agency-Payroll/iqwc-r2w7"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-700"
          >
            Source Data ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
