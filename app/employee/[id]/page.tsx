import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getAvailableYears, getEmployeeDetail } from '@/lib/socrata';
import { StatGrid } from '@/components/stats/StatGrid';
import { PayBreakdownChart } from '@/components/charts/PayBreakdownChart';
import { DistributionWithMarker } from '@/components/charts/DistributionWithMarker';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { YearSelector } from '@/components/ui/YearSelector';
import { formatCurrency, formatNumber, ordinal } from '@/lib/format';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}

async function EmployeeContent({ payrollId, year }: { payrollId: string; year: number }) {
  const employee = await getEmployeeDetail(payrollId, year);

  if (!employee) notFound();

  const tenureYears = employee.hireDate
    ? Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  const totalBreakdown =
    employee.payBreakdown.regularPay +
    employee.payBreakdown.overtimePay +
    employee.payBreakdown.supplementalPay +
    employee.payBreakdown.oneTimePayments +
    employee.payBreakdown.lumpSumPay +
    employee.payBreakdown.retroactivePay +
    employee.payBreakdown.clothingPay +
    employee.payBreakdown.cashInLieu;

  const hasDetailedBreakdown = totalBreakdown > 0;

  const statItems = [
    { label: 'Total YTD Earnings', value: formatCurrency(employee.ytdEarnings), subtext: `${year} calendar year` },
    {
      label: `Percentile in ${employee.title.length > 20 ? employee.title.slice(0, 19) + '…' : employee.title}`,
      value: `${ordinal(employee.titlePercentile)} percentile`,
      subtext: `among ${employee.title} employees`,
    },
    {
      label: 'Percentile in Agency',
      value: `${ordinal(employee.agencyPercentile)} percentile`,
      subtext: `among ${employee.agency} employees`,
    },
    {
      label: 'Base Salary / Rate',
      value: employee.compensationMethod.toLowerCase().includes('hour')
        ? `$${employee.salaryHourlyRate}/hr`
        : formatCurrency(employee.salaryHourlyRate),
      subtext: employee.compensationMethod,
    },
    ...(tenureYears !== null
      ? [{ label: 'Tenure', value: `${tenureYears} year${tenureYears !== 1 ? 's' : ''}`, subtext: `hired ${employee.hireDate?.slice(0, 10) ?? ''}` }]
      : []),
    ...(employee.employeeRelationsGroup
      ? [{ label: 'Employee Group', value: employee.employeeRelationsGroup, subtext: 'union / employee relations' }]
      : []),
  ];

  return (
    <div className="space-y-10">
      {/* Overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500">Agency</p>
            <a href={`/agency/${employee.agencySlug}`} className="text-base font-semibold text-blue-700 hover:underline">
              {employee.agency}
            </a>
          </div>
          <div>
            <p className="text-sm text-gray-500">Section</p>
            <p className="text-base font-semibold text-gray-900">{employee.section || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Job Title</p>
            <a href={`/title/${employee.titleSlug}`} className="text-base font-semibold text-blue-700 hover:underline">
              {employee.title}
            </a>
          </div>
        </div>
      </div>

      <StatGrid stats={statItems} />

      {/* Pay breakdown */}
      {hasDetailedBreakdown && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">Pay Breakdown</h2>
          <p className="mb-3 text-sm text-gray-500">
            Detailed components from all paying agencies for {year}.
          </p>
          <PayBreakdownChart data={[{ label: employee.fullName, breakdown: employee.payBreakdown }]} />
        </section>
      )}

      {/* Distribution charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">
            Salary Distribution — {employee.title.length > 25 ? employee.title.slice(0, 24) + '…' : employee.title}
          </h2>
          <p className="mb-3 text-sm text-gray-500">
            Red line shows this employee's position ({ordinal(employee.titlePercentile)} percentile).
          </p>
          <DistributionWithMarker
            values={employee.titleDistribution}
            markerValue={employee.ytdEarnings}
            markerLabel={employee.firstName}
          />
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">
            Salary Distribution — {employee.agency.length > 25 ? employee.agency.slice(0, 24) + '…' : employee.agency}
          </h2>
          <p className="mb-3 text-sm text-gray-500">
            Red line shows this employee's position ({ordinal(employee.agencyPercentile)} percentile).
          </p>
          <DistributionWithMarker
            values={employee.agencyDistribution}
            markerValue={employee.ytdEarnings}
            markerLabel={employee.firstName}
          />
        </section>
      </div>
    </div>
  );
}

export default async function EmployeePage({ params, searchParams }: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const years = await getAvailableYears();
  const year = sp.year ? parseInt(sp.year) : (years[0] ?? new Date().getFullYear());

  // Quick fetch to get name for heading
  const employee = await getEmployeeDetail(id, year);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'New Jersey', href: '/' },
              employee
                ? { label: employee.agency, href: `/agency/${employee.agencySlug}` }
                : { label: 'Agency' },
              employee
                ? { label: employee.title, href: `/title/${employee.titleSlug}` }
                : { label: 'Title' },
              { label: employee?.fullName ?? id },
            ]}
          />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {employee?.fullName ?? id}
          </h1>
        </div>
        <Suspense>
          <YearSelector years={years} current={year} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-xl bg-gray-200" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
            </div>
          </div>
        }
      >
        <EmployeeContent payrollId={id} year={year} />
      </Suspense>
    </div>
  );
}
