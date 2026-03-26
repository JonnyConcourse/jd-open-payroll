import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getAgencies, getAgencyDetail, getAvailableYears } from '@/lib/socrata';
import { StatGrid } from '@/components/stats/StatGrid';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { SalaryHistogram } from '@/components/charts/SalaryHistogram';
import { AgencyComparisonBar } from '@/components/charts/AgencyComparisonBar';
import { PayBreakdownChart } from '@/components/charts/PayBreakdownChart';
import { QuarterlyTrendChart } from '@/components/charts/QuarterlyTrendChart';
import { SortableTable, Column } from '@/components/tables/SortableTable';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { YearSelector } from '@/components/ui/YearSelector';
import { formatCurrency, formatNumber, ordinal } from '@/lib/format';
import { buildSlugMap } from '@/lib/slugs';
import { EmployeeRecord } from '@/types/payroll';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
}

async function AgencyContent({ slug, year }: { slug: string; year: number }) {
  const agencies = await getAgencies(year);
  const allNames = agencies.map((a) => a.name);
  const slugMap = buildSlugMap(allNames);
  const agencyName = slugMap.get(slug);

  if (!agencyName) notFound();

  const detail = await getAgencyDetail(agencyName, year);

  const statItems = [
    { label: 'Headcount', value: formatNumber(detail.headcount), subtext: `${ordinal(detail.rank)} largest agency` },
    { label: 'Total Payroll', value: formatCurrency(detail.totalPayroll, true), subtext: `${year} full year` },
    { label: 'Median Salary', value: formatCurrency(detail.medianSalary), subtext: 'annual YTD earnings' },
    { label: 'Avg Overtime', value: formatCurrency(detail.avgOvertimePay), subtext: 'per employee' },
  ];

  const titleBarData = detail.topTitles.map((t) => ({
    name: t.title.length > 35 ? t.title.slice(0, 34) + '\u2026' : t.title,
    value: t.count,
    href: `/title/${t.slug}`,
  }));

  const earnerColumns: Column<EmployeeRecord>[] = [
    { key: 'fullName', header: 'Name', sortable: true, href: (r) => `/employee/${r.payrollId}` },
    { key: 'title', header: 'Title', sortable: true, href: (r) => `/title/${r.titleSlug}` },
    {
      key: 'ytdEarnings',
      header: 'Total Earnings',
      sortable: true,
      render: (r) => formatCurrency(r.ytdEarnings),
    },
    {
      key: 'overtimePay',
      header: 'Overtime',
      sortable: true,
      render: (r) => formatCurrency(r.overtimePay),
    },
  ];

  const titleColumns: Column<(typeof detail.allTitles)[0]>[] = [
    { key: 'title', header: 'Title', sortable: true, href: (r) => `/title/${r.slug}` },
    { key: 'count', header: '# Employees', sortable: true, render: (r) => formatNumber(r.count) },
    {
      key: 'medianSalary',
      header: 'Median Salary',
      sortable: true,
      render: (r) => formatCurrency(r.medianSalary),
    },
  ];

  return (
    <div className="space-y-10">
      <StatGrid stats={statItems} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Top Job Titles</h2>
          <HorizontalBarChart data={titleBarData} valueLabel="Employees" />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Salary Distribution</h2>
          <SalaryHistogram values={detail.salaryValues} />
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Median Salary vs. All Agencies</h2>
        <AgencyComparisonBar data={detail.allAgenciesMedians} highlightName={agencyName} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">Pay Breakdown</h2>
          <p className="mb-2 text-sm text-gray-500">Average per employee from MASTER records.</p>
          <PayBreakdownChart data={[{ label: detail.name, breakdown: detail.payBreakdown }]} />
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">Payroll Trend</h2>
          <QuarterlyTrendChart data={detail.quarterlyTrend} metric="totalPayroll" />
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Top 20 Earners</h2>
        <SortableTable
          columns={earnerColumns}
          data={detail.topEarners}
          rowKey={(r) => r.payrollId}
          pageSize={20}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          All Job Titles ({formatNumber(detail.allTitles.length)})
        </h2>
        <SortableTable
          columns={titleColumns}
          data={detail.allTitles}
          rowKey={(r) => r.title}
          pageSize={25}
        />
      </section>
    </div>
  );
}

export default async function AgencyPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const years = await getAvailableYears();
  const year = sp.year ? parseInt(sp.year) : (years[0] ?? new Date().getFullYear());

  // Resolve name for heading (best effort before full fetch)
  const agencies = await getAgencies(year);
  const slugMap = buildSlugMap(agencies.map((a) => a.name));
  const agencyName = slugMap.get(slug) ?? slug;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'New Jersey', href: '/' },
              { label: agencyName },
            ]}
          />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{agencyName}</h1>
        </div>
        <Suspense>
          <YearSelector years={years} current={year} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
            </div>
            <div className="h-96 rounded-xl bg-gray-200" />
          </div>
        }
      >
        <AgencyContent slug={slug} year={year} />
      </Suspense>
    </div>
  );
}
