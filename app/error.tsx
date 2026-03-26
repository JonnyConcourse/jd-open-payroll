'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-red-100 p-4">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-sm">
          Could not load payroll data. The NJ data API may be temporarily unavailable.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={() => unstable_retry()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
