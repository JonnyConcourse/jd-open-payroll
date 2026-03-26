import {
  AgencyDetail,
  AgencyStats,
  EmployeeDetail,
  EmployeeRecord,
  GovernmentStats,
  PayBreakdown,
  QuarterlyPoint,
  SearchResult,
  SocrataDetailRecord,
  SocrataRecord,
  TitleDetail,
  TitleStats,
} from '@/types/payroll';
import { average, median, percentile, percentileRank } from './statistics';
import { buildNameToSlugMap, toSlug } from './slugs';

const BASE = 'https://data.nj.gov/resource/iqwc-r2w7.json';

function headers(): HeadersInit {
  const token = process.env.SOCRATA_APP_TOKEN;
  return token ? { 'X-App-Token': token } : {};
}

async function socrataFetch<T>(params: Record<string, string>): Promise<T[]> {
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString(), {
      headers: headers(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error(`Socrata API error: ${res.status} ${res.statusText} — ${url}`);
      return [];
    }
    return res.json() as Promise<T[]>;
  } catch (err) {
    console.error(`Socrata fetch exception: ${err} — ${url}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helper parsers
// ---------------------------------------------------------------------------

function parseNum(s: string | undefined | null): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[$,]/g, '')) || 0;
}

function toEmployeeRecord(r: SocrataRecord, agencySlugMap: Map<string, string>, titleSlugMap: Map<string, string>): EmployeeRecord {
  const agency = r.master_department_agency_desc?.trim() ?? '';
  const title = r.master_title_desc?.trim() ?? '';
  return {
    payrollId: r.payroll_id,
    fullName: r.full_name?.trim() ?? '',
    firstName: r.first_name?.trim() ?? '',
    lastName: r.last_name?.trim() ?? '',
    agency,
    agencySlug: agencySlugMap.get(agency) ?? toSlug(agency),
    section: r.master_section_desc?.trim() ?? '',
    title,
    titleSlug: titleSlugMap.get(title) ?? toSlug(title),
    salaryHourlyRate: parseNum(r.salary_hourly_rate),
    compensationMethod: r.compensation_method?.trim() ?? '',
    employeeRelationsGroup: r.employee_relations_group?.trim() ?? '',
    hireDate: r.original_employment_dte ?? null,
    ytdEarnings: parseNum(r.master_ytd_earnings),
    regularPay: parseNum(r.master_ytd_regular_pay),
    overtimePay: parseNum(r.master_ytd_overtime_payments),
    otherPay: parseNum(r.master_ytd_all_other_payments),
    year: parseInt(r.calendar_year),
    quarter: parseInt(r.calendar_quarter),
  };
}

function parseDetailBreakdown(details: SocrataDetailRecord[]): PayBreakdown {
  const sum = (field: keyof SocrataDetailRecord) =>
    details.reduce((acc, r) => acc + parseNum(r[field] as string), 0);
  return {
    regularPay: sum('regular_pay'),
    overtimePay: sum('overtime_payments'),
    supplementalPay: sum('supplemental_pay'),
    oneTimePayments: sum('one_time_payments'),
    lumpSumPay: sum('lump_sum_pay'),
    retroactivePay: sum('retroactive_pay'),
    clothingPay: sum('clothing_uniform_payments'),
    cashInLieu: sum('cash_in_lieu_maintenance'),
  };
}

// ---------------------------------------------------------------------------
// Available years
// ---------------------------------------------------------------------------

export async function getAvailableYears(): Promise<number[]> {
  const rows = await socrataFetch<{ calendar_year: string }>({
    $select: 'calendar_year',
    $where: "record_type='MASTER'",
    $group: 'calendar_year',
    $order: 'calendar_year DESC',
    $limit: '20',
  });
  return rows.map((r) => parseInt(r.calendar_year)).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Government overview
// ---------------------------------------------------------------------------

export async function getGovernmentStats(year: number): Promise<GovernmentStats> {
  // Fetch all MASTER records for Q4 of this year (YTD = full year)
  const [masterRows, agencyRows, titleRows, trendRows] = await Promise.all([
    socrataFetch<SocrataRecord>({
      $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4'`,
      $select:
        'payroll_id,master_ytd_earnings,master_ytd_regular_pay,master_ytd_overtime_payments,master_ytd_all_other_payments,master_department_agency_desc,master_title_desc',
      $limit: '50000',
    }),
    socrataFetch<{ master_department_agency_desc: string }>({
      $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4'`,
      $select: 'master_department_agency_desc',
      $group: 'master_department_agency_desc',
      $limit: '500',
    }),
    socrataFetch<{ master_title_desc: string }>({
      $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4'`,
      $select: 'master_title_desc',
      $group: 'master_title_desc',
      $limit: '5000',
    }),
    // Trend: total payroll per quarter across all years
    socrataFetch<{
      calendar_year: string;
      calendar_quarter: string;
      total_payroll: string;
      headcount: string;
    }>({
      $where: "record_type='MASTER'",
      $select: 'calendar_year,calendar_quarter,SUM(master_ytd_earnings) AS total_payroll,COUNT(*) AS headcount',
      $group: 'calendar_year,calendar_quarter',
      $order: 'calendar_year ASC,calendar_quarter ASC',
      $limit: '200',
    }),
  ]);

  const salaries = masterRows.map((r) => parseNum(r.master_ytd_earnings));
  const totalRegular = masterRows.reduce((s, r) => s + parseNum(r.master_ytd_regular_pay), 0);
  const totalOT = masterRows.reduce((s, r) => s + parseNum(r.master_ytd_overtime_payments), 0);
  const totalOther = masterRows.reduce((s, r) => s + parseNum(r.master_ytd_all_other_payments), 0);

  const quarterlyTrend: QuarterlyPoint[] = trendRows.map((r) => ({
    year: parseInt(r.calendar_year),
    quarter: parseInt(r.calendar_quarter),
    label: `Q${r.calendar_quarter} ${r.calendar_year}`,
    totalPayroll: parseNum(r.total_payroll),
    headcount: parseInt(r.headcount),
  }));

  return {
    year,
    headcount: masterRows.length,
    totalPayroll: salaries.reduce((a, b) => a + b, 0),
    medianSalary: median(salaries),
    avgSalary: average(salaries),
    agencyCount: agencyRows.length,
    titleCount: titleRows.length,
    payBreakdown: {
      regularPay: totalRegular / (masterRows.length || 1),
      overtimePay: totalOT / (masterRows.length || 1),
      supplementalPay: 0, // not in MASTER records
      oneTimePayments: 0,
      lumpSumPay: 0,
      retroactivePay: 0,
      clothingPay: 0,
      cashInLieu: 0,
    },
    quarterlyTrend,
  };
}

// ---------------------------------------------------------------------------
// Agencies
// ---------------------------------------------------------------------------

export async function getAgencies(year: number): Promise<AgencyStats[]> {
  const rows = await socrataFetch<SocrataRecord>({
    $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4'`,
    $select:
      'master_department_agency_desc,master_ytd_earnings,master_ytd_overtime_payments',
    $limit: '50000',
  });

  const byAgency = new Map<string, { earnings: number[]; ot: number[] }>();
  for (const r of rows) {
    const name = r.master_department_agency_desc?.trim() ?? 'Unknown';
    if (!byAgency.has(name)) byAgency.set(name, { earnings: [], ot: [] });
    byAgency.get(name)!.earnings.push(parseNum(r.master_ytd_earnings));
    byAgency.get(name)!.ot.push(parseNum(r.master_ytd_overtime_payments));
  }

  const allNames = [...byAgency.keys()];
  const nameToSlug = buildNameToSlugMap(allNames);

  return allNames.map((name) => {
    const { earnings, ot } = byAgency.get(name)!;
    return {
      name,
      slug: nameToSlug.get(name) ?? toSlug(name),
      headcount: earnings.length,
      totalPayroll: earnings.reduce((a, b) => a + b, 0),
      medianSalary: median(earnings),
      avgOvertimePay: average(ot),
    };
  });
}

export async function getAgencyDetail(agencyName: string, year: number): Promise<AgencyDetail> {
  const [agencyRows, agencyTrendRows, allAgencyStats] = await Promise.all([
    socrataFetch<SocrataRecord>({
      $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4' AND master_department_agency_desc='${agencyName.replace(/'/g, "''")}'`,
      $limit: '10000',
    }),
    socrataFetch<{
      calendar_year: string;
      calendar_quarter: string;
      total_payroll: string;
      headcount: string;
    }>({
      $where: `record_type='MASTER' AND master_department_agency_desc='${agencyName.replace(/'/g, "''")}'`,
      $select: 'calendar_year,calendar_quarter,SUM(master_ytd_earnings) AS total_payroll,COUNT(*) AS headcount',
      $group: 'calendar_year,calendar_quarter',
      $order: 'calendar_year ASC,calendar_quarter ASC',
      $limit: '200',
    }),
    getAgencies(year),
  ]);

  const allAgencyNames = allAgencyStats.map((a) => a.name);
  const agencyNameToSlug = buildNameToSlugMap(allAgencyNames);
  const allTitleNames = [...new Set(agencyRows.map((r) => r.master_title_desc?.trim() ?? ''))];
  const titleNameToSlug = buildNameToSlugMap(allTitleNames);

  const employees = agencyRows.map((r) =>
    toEmployeeRecord(r, agencyNameToSlug, titleNameToSlug)
  );

  const salaries = employees.map((e) => e.ytdEarnings);
  const totalPayroll = salaries.reduce((a, b) => a + b, 0);

  // Title breakdown
  const titleCounts = new Map<string, { count: number; salaries: number[] }>();
  for (const e of employees) {
    if (!titleCounts.has(e.title)) titleCounts.set(e.title, { count: 0, salaries: [] });
    const t = titleCounts.get(e.title)!;
    t.count++;
    t.salaries.push(e.ytdEarnings);
  }

  const allTitles = [...titleCounts.entries()]
    .map(([title, { count, salaries }]) => ({
      title,
      slug: titleNameToSlug.get(title) ?? toSlug(title),
      count,
      medianSalary: median(salaries),
    }))
    .sort((a, b) => b.count - a.count);

  const sortedByPay = [...employees].sort((a, b) => b.ytdEarnings - a.ytdEarnings);
  const agencyMedian = median(salaries);
  const rank = allAgencyStats.filter((a) => a.headcount > employees.length).length + 1;

  const quarterlyTrend: QuarterlyPoint[] = agencyTrendRows.map((r) => ({
    year: parseInt(r.calendar_year),
    quarter: parseInt(r.calendar_quarter),
    label: `Q${r.calendar_quarter} ${r.calendar_year}`,
    totalPayroll: parseNum(r.total_payroll),
    headcount: parseInt(r.headcount),
  }));

  const allAgenciesMedians = allAgencyStats
    .map((a) => ({ name: a.name, slug: agencyNameToSlug.get(a.name) ?? toSlug(a.name), medianSalary: a.medianSalary }))
    .sort((a, b) => b.medianSalary - a.medianSalary);

  return {
    name: agencyName,
    slug: agencyNameToSlug.get(agencyName) ?? toSlug(agencyName),
    headcount: employees.length,
    totalPayroll,
    medianSalary: agencyMedian,
    avgOvertimePay: average(employees.map((e) => e.overtimePay)),
    rank,
    topTitles: allTitles.slice(0, 15),
    topEarners: sortedByPay.slice(0, 20),
    salaryValues: salaries,
    allTitles,
    payBreakdown: {
      regularPay: average(employees.map((e) => e.regularPay)),
      overtimePay: average(employees.map((e) => e.overtimePay)),
      supplementalPay: 0,
      oneTimePayments: 0,
      lumpSumPay: 0,
      retroactivePay: 0,
      clothingPay: 0,
      cashInLieu: 0,
    },
    quarterlyTrend,
    allAgenciesMedians,
  };
}

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

export async function getTitles(year: number): Promise<TitleStats[]> {
  const rows = await socrataFetch<SocrataRecord>({
    $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4'`,
    $select: 'master_title_desc,master_ytd_earnings',
    $limit: '50000',
  });

  const byTitle = new Map<string, number[]>();
  for (const r of rows) {
    const name = r.master_title_desc?.trim() ?? 'Unknown';
    if (!byTitle.has(name)) byTitle.set(name, []);
    byTitle.get(name)!.push(parseNum(r.master_ytd_earnings));
  }

  const allNames = [...byTitle.keys()];
  const nameToSlug = buildNameToSlugMap(allNames);

  return allNames.map((name) => {
    const salaries = byTitle.get(name)!;
    return {
      name,
      slug: nameToSlug.get(name) ?? toSlug(name),
      count: salaries.length,
      medianSalary: median(salaries),
      p25: percentile(salaries, 25),
      p75: percentile(salaries, 75),
      minSalary: Math.min(...salaries),
      maxSalary: Math.max(...salaries),
    };
  });
}

export async function getTitleDetail(titleName: string, year: number): Promise<TitleDetail> {
  const [titleRows, allTitleStats] = await Promise.all([
    socrataFetch<SocrataRecord>({
      $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4' AND master_title_desc='${titleName.replace(/'/g, "''")}'`,
      $limit: '10000',
    }),
    getTitles(year),
  ]);

  const allAgencyNames = [...new Set(titleRows.map((r) => r.master_department_agency_desc?.trim() ?? ''))];
  const agencyNameToSlug = buildNameToSlugMap(allAgencyNames);
  const allTitleNames = allTitleStats.map((t) => t.name);
  const titleNameToSlug = buildNameToSlugMap(allTitleNames);

  const employees = titleRows.map((r) =>
    toEmployeeRecord(r, agencyNameToSlug, titleNameToSlug)
  );

  const salaries = employees.map((e) => e.ytdEarnings);

  // Agency distribution
  const agencyCounts = new Map<string, number>();
  for (const e of employees) {
    agencyCounts.set(e.agency, (agencyCounts.get(e.agency) ?? 0) + 1);
  }
  const agencyDistribution = [...agencyCounts.entries()]
    .map(([agency, count]) => ({
      agency,
      slug: agencyNameToSlug.get(agency) ?? toSlug(agency),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Similar titles: same median salary range (±20%)
  const myMedian = median(salaries);
  const similarTitles = allTitleStats
    .filter((t) => t.name !== titleName && Math.abs(t.medianSalary - myMedian) / (myMedian || 1) < 0.2)
    .slice(0, 10)
    .map((t) => ({ name: t.name, slug: t.slug, medianSalary: t.medianSalary }));

  const thisStats = allTitleStats.find((t) => t.name === titleName);

  return {
    name: titleName,
    slug: titleNameToSlug.get(titleName) ?? toSlug(titleName),
    count: employees.length,
    medianSalary: myMedian,
    p25: percentile(salaries, 25),
    p75: percentile(salaries, 75),
    minSalary: salaries.length ? Math.min(...salaries) : 0,
    maxSalary: salaries.length ? Math.max(...salaries) : 0,
    agencyDistribution,
    employees: employees.sort((a, b) => b.ytdEarnings - a.ytdEarnings),
    salaryValues: salaries,
    payBreakdown: {
      regularPay: average(employees.map((e) => e.regularPay)),
      overtimePay: average(employees.map((e) => e.overtimePay)),
      supplementalPay: 0,
      oneTimePayments: 0,
      lumpSumPay: 0,
      retroactivePay: 0,
      clothingPay: 0,
      cashInLieu: 0,
    },
    similarTitles,
  };
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export async function getEmployees(params: {
  agency?: string;
  title?: string;
  year: number;
  page?: number;
  pageSize?: number;
}): Promise<{ records: EmployeeRecord[]; total: number }> {
  const { agency, title, year, page = 1, pageSize = 50 } = params;

  const conditions = [
    `record_type='MASTER'`,
    `calendar_year='${year}'`,
    `calendar_quarter='4'`,
  ];
  if (agency) conditions.push(`master_department_agency_desc='${agency.replace(/'/g, "''")}'`);
  if (title) conditions.push(`master_title_desc='${title.replace(/'/g, "''")}'`);

  const offset = (page - 1) * pageSize;
  const rows = await socrataFetch<SocrataRecord>({
    $where: conditions.join(' AND '),
    $limit: String(pageSize),
    $offset: String(offset),
    $order: 'master_ytd_earnings DESC',
  });

  // Count
  const countRows = await socrataFetch<{ count: string }>({
    $where: conditions.join(' AND '),
    $select: 'COUNT(*) AS count',
    $limit: '1',
  });

  const total = parseInt(countRows[0]?.count ?? '0');
  const agencyNames = [...new Set(rows.map((r) => r.master_department_agency_desc?.trim() ?? ''))];
  const titleNames = [...new Set(rows.map((r) => r.master_title_desc?.trim() ?? ''))];

  const records = rows.map((r) =>
    toEmployeeRecord(r, buildNameToSlugMap(agencyNames), buildNameToSlugMap(titleNames))
  );

  return { records, total };
}

export async function getEmployeeDetail(payrollId: string, year: number): Promise<EmployeeDetail | null> {
  const [masterRows, detailRows] = await Promise.all([
    socrataFetch<SocrataRecord>({
      $where: `record_type='MASTER' AND payroll_id='${payrollId}' AND calendar_year='${year}' AND calendar_quarter='4'`,
      $limit: '1',
    }),
    socrataFetch<SocrataDetailRecord>({
      $where: `record_type='DETAIL' AND payroll_id='${payrollId}' AND calendar_year='${year}'`,
      $limit: '100',
    }),
  ]);

  if (!masterRows[0]) return null;

  const master = masterRows[0];
  const agency = master.master_department_agency_desc?.trim() ?? '';
  const title = master.master_title_desc?.trim() ?? '';

  // Fetch cohort data for percentile calculations
  const [agencyRows, titleRows] = await Promise.all([
    socrataFetch<{ master_ytd_earnings: string }>({
      $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4' AND master_department_agency_desc='${agency.replace(/'/g, "''")}'`,
      $select: 'master_ytd_earnings',
      $limit: '50000',
    }),
    socrataFetch<{ master_ytd_earnings: string }>({
      $where: `record_type='MASTER' AND calendar_year='${year}' AND calendar_quarter='4' AND master_title_desc='${title.replace(/'/g, "''")}'`,
      $select: 'master_ytd_earnings',
      $limit: '50000',
    }),
  ]);

  const agencyDistribution = agencyRows.map((r) => parseNum(r.master_ytd_earnings));
  const titleDistribution = titleRows.map((r) => parseNum(r.master_ytd_earnings));
  const ytdEarnings = parseNum(master.master_ytd_earnings);

  const agencySlugMap = buildNameToSlugMap([agency]);
  const titleSlugMap = buildNameToSlugMap([title]);
  const base = toEmployeeRecord(master, agencySlugMap, titleSlugMap);
  const payBreakdown = parseDetailBreakdown(detailRows);

  return {
    ...base,
    payBreakdown,
    titlePercentile: percentileRank(titleDistribution, ytdEarnings),
    agencyPercentile: percentileRank(agencyDistribution, ytdEarnings),
    titleDistribution,
    agencyDistribution,
  };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchPayroll(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const q = query.replace(/'/g, "''");

  const [agencyRows, titleRows, employeeRows] = await Promise.all([
    socrataFetch<{ master_department_agency_desc: string; count: string }>({
      $where: `record_type='MASTER' AND calendar_quarter='4'`,
      $select: `master_department_agency_desc,COUNT(*) AS count`,
      $group: 'master_department_agency_desc',
      $having: `UPPER(master_department_agency_desc) LIKE UPPER('%${q}%')`,
      $limit: '5',
    }),
    socrataFetch<{ master_title_desc: string; count: string }>({
      $where: `record_type='MASTER' AND calendar_quarter='4'`,
      $select: 'master_title_desc,COUNT(*) AS count',
      $group: 'master_title_desc',
      $having: `UPPER(master_title_desc) LIKE UPPER('%${q}%')`,
      $limit: '5',
    }),
    socrataFetch<SocrataRecord>({
      $where: `record_type='MASTER' AND calendar_quarter='4' AND UPPER(full_name) LIKE UPPER('%${q}%')`,
      $select: 'payroll_id,full_name,master_department_agency_desc,master_title_desc,calendar_year',
      $order: 'calendar_year DESC',
      $limit: '5',
    }),
  ]);

  const results: SearchResult[] = [];

  for (const r of agencyRows) {
    const name = r.master_department_agency_desc?.trim() ?? '';
    results.push({
      type: 'agency',
      label: name,
      sublabel: `${parseInt(r.count).toLocaleString()} employees`,
      href: `/agency/${toSlug(name)}`,
    });
  }
  for (const r of titleRows) {
    const name = r.master_title_desc?.trim() ?? '';
    results.push({
      type: 'title',
      label: name,
      sublabel: `${parseInt(r.count).toLocaleString()} employees`,
      href: `/title/${toSlug(name)}`,
    });
  }
  for (const r of employeeRows) {
    results.push({
      type: 'employee',
      label: r.full_name?.trim() ?? '',
      sublabel: `${r.master_department_agency_desc?.trim()} · ${r.calendar_year}`,
      href: `/employee/${r.payroll_id}`,
    });
  }

  return results;
}
