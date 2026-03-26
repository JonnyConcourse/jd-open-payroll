import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getAvailableYears, getTitleDetail, getTitles } from '@/lib/socrata';
import { StatGrid } from '@/components/stats/StatGrid';
import { SalaryBoxPlot } from '@/components/charts/SalaryBoxPlot';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { TitleComparisonBar } from '@/components/charts/TitleComparisonBar';
import { PayBreakdownChart } from '@/components/charts/PayBreakdownChart';
import { SortableTable, Column } from '@/components/tables/SortableTable';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { YearSelector } from '@/components/ui/YearSelector';
import { formatCurrency, formatNumber } from '@/lib/format';
import { buildSlugMap } from '@/lib/slugs';
import { EmployeeRecord } from '@/types/payroll';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
}

async function TitleContent({ slug, year }: { slug: string; year: number }) {
  const titles = await getTitles(year);
  const slugMap = buildSlugMap(titles.map((t) => t.name));
  const titleName = slugMap.get(slug);

  if (!titleName) notFound();

  const detail = await getTitleDetail(titleName, year);

  const otPercent = detail.payBreakdown.overtimePay > 0
    ? Math.round((detail.payBreakdown.overtimePay / (detail.payBreakdown.regularPay + detail.payBreakdown.overtimePay || 1)) * 100)
    : 0;

  const statItems = [
    { label: 'Employees', value: formatNumber(detail.count), subtext: `with this title in ${year}` },
    { label: 'Median Salary', value: formatCurrency(detail.medianSalary), subtext: 'annual YTD earnings' },
    { label: 'Salary Range', value: `${formatCurrency(detail.minSalary, true)} \u2013 ${formatCurrency(detail.maxSalary, true)}`, subtext: 'min to max' },
    { label: 'OT as % of Pay', value: `${otPercent}%`, subtext: 'avg overtime share' },
  ];

  const agencyBarData = detail.agencyDistribution.slice(0, 12).map((a) => ({
    name: a.agency.length > 35 ? a.agency.slice(0, 34) + '\u2026' : a.agency,
    value: a.count,
    href: `/agency/${a.slug}`,
  }));

  const employeeColumns: Column<EmployeeRecord>[] = [
    { key: 'fullName', header: 'Name', sortable: true, href: (r) => `/employee/${r.payrollId}` },
    { key: 'agency', header: 'Agency', sortable: true, href: (r) => `/agency/${r.agencySlug}` },
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

  const comparisonData = [
    { name: titleName, slug, medianSalary: detail.medianSalary },
    ...detail.similarTitles,
  ];

  return (
    <div className="space-y-10">
      <StatGrid stats={statItems} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Salary Distribution</h2>
        <SalaryBoxPlot
          min={detail.minSalary}
          p25={detail.p25}
          median={detail.medianSalary}
          p75={detail.p75}
          max={detail.maxSalary}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Agencies Employing This Title</h2>
          <HorizontalBarChart data={agencyBarData} valueLabel="Employees" />
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">Pay Breakdown</h2>
          <p className="mb-2 text-sm text-gray-500">Average per employee. High OT % is common for public safety titles.</p>
          <PayBreakdownChart data={[{ label: titleName, breakdown: detail.payBreakdown }]} />
        </section>
      </div>

      {comparisonData.length > 1 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Similar Job Titles by Median Salary</h2>
          <TitleComparisonBar data={comparisonData} highlightName={titleName} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Employees with This Title ({formatNumber(detail.count)})
        </h2>
        <SortableTable
          columns={employeeColumns}
          data={detail.employees}
          rowKey={(r) => r.payrollId}
          pageSize={50}
        />
      </section>
    </div>
  );
}

export default async function TitlePage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const years = await getAvailableYears();
  const year = sp.year ? parseInt(sp.year) : (years[0] ?? new Date().getFullYear());

  const titles = await getTitles(year);
  const slugMap = buildSlugMap(titles.map((t) => t.name));
  const titleName = slugMap.get(slug) ?? slug;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'New Jersey', href: '/' },
              { label: 'Job Titles' },
              { label: titleName },
            ]}
          />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{titleName}</h1>
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
            <div className="h-64 rounded-xl bg-gray-200" />
          </div>
        }
      >
        <TitleContent slug={slug} year={year} />
      </Suspense>
    </div>
  );
}
