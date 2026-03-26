'use client';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center font-sans">
        <h1 className="text-2xl font-bold text-gray-900">Open Payroll NJ</h1>
        <p className="text-gray-500 max-w-sm">
          The page encountered an unexpected error. This is usually a temporary issue with the NJ payroll data API.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={() => unstable_retry()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
