import { Suspense } from 'react';
import { getAgencies, getAvailableYears, getGovernmentStats } from '@/lib/socrata';
import { StatGrid } from '@/components/stats/StatGrid';
import { PayrollTreemap } from '@/components/charts/PayrollTreemap';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { PayBreakdownChart } from '@/components/charts/PayBreakdownChart';
import { QuarterlyTrendChart } from '@/components/charts/QuarterlyTrendChart';
import { YearSelector } from '@/components/ui/YearSelector';
import { formatCurrency, formatNumber } from '@/lib/format';

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

async function GovernmentOverview({ year }: { year: number }) {
  const [stats, agencies] = await Promise.all([
    getGovernmentStats(year),
    getAgencies(year),
  ]);

  const sortedByPayroll = [...agencies].sort((a, b) => b.totalPayroll - a.totalPayroll);
  const sortedByHeadcount = [...agencies].sort((a, b) => b.headcount - a.headcount).slice(0, 10);

  const treemapData = sortedByPayroll.map((a) => ({
    name: a.name,
    value: a.totalPayroll,
    href: `/agency/${a.slug}`,
  }));

  const agencyBarData = sortedByHeadcount.map((a) => ({
    name: a.name.length > 35 ? a.name.slice(0, 34) + '\u2026' : a.name,
    value: a.headcount,
    href: `/agency/${a.slug}`,
  }));

  const statItems = [
    {
      label: 'Total Payroll',
      value: formatCurrency(stats.totalPayroll, true),
      subtext: `${year} full year`,
    },
    {
      label: 'Total Employees',
      value: formatNumber(stats.headcount),
      subtext: 'unique payroll records',
    },
    {
      label: 'Median Salary',
      value: formatCurrency(stats.medianSalary),
      subtext: 'annual YTD earnings',
    },
    {
      label: 'Average Salary',
      value: formatCurrency(stats.avgSalary),
      subtext: 'annual YTD earnings',
    },
    {
      label: 'Agencies',
      value: formatNumber(stats.agencyCount),
      subtext: 'departments & agencies',
    },
    {
      label: 'Job Titles',
      value: formatNumber(stats.titleCount),
      subtext: 'unique titles',
    },
    {
      label: 'Avg Regular Pay',
      value: formatCurrency(stats.payBreakdown.regularPay),
      subtext: 'per employee',
    },
    {
      label: 'Avg Overtime Pay',
      value: formatCurrency(stats.payBreakdown.overtimePay),
      subtext: 'per employee',
    },
  ];

  return (
    <div className="space-y-10">
      <StatGrid stats={statItems} />

      <section>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Payroll Spend by Agency</h2>
        <p className="mb-4 text-sm text-gray-500">Click an agency to explore its employees and job titles.</p>
        <PayrollTreemap data={treemapData} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Top 10 Agencies by Headcount</h2>
        <HorizontalBarChart
          data={agencyBarData}
          valueLabel="Employees"
        />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Total Payroll by Quarter</h2>
        <p className="mb-2 text-sm text-gray-500">Year-to-date figures reset each January.</p>
        <QuarterlyTrendChart data={stats.quarterlyTrend} metric="totalPayroll" />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Average Pay Breakdown per Employee</h2>
        <p className="mb-2 text-sm text-gray-500">
          Regular vs. overtime from MASTER records. Detailed components available on individual employee pages.
        </p>
        <PayBreakdownChart
          data={[{ label: `NJ Gov ${year}`, breakdown: stats.payBreakdown }]}
        />
      </section>
    </div>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const years = await getAvailableYears();
  const apiUnavailable = years.length === 0;
  const year = sp.year ? parseInt(sp.year) : (years[0] ?? new Date().getFullYear());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Jersey Government Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore how your tax dollars are spent across all state agencies.
          </p>
        </div>
        <Suspense>
          <YearSelector years={years} current={year} />
        </Suspense>
      </div>

      {apiUnavailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Data unavailable.</strong> The NJ payroll API could not be reached. This may be a temporary outage or a missing API token. Please try again later.
        </div>
      )}

      {!apiUnavailable && (
        <Suspense
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-gray-200" />
                ))}
              </div>
              <div className="h-96 rounded-xl bg-gray-200" />
            </div>
          }
        >
          <GovernmentOverview year={year} />
        </Suspense>
      )}
    </div>
  );
}
