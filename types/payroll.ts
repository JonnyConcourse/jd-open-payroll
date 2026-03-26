export interface PayBreakdown {
  regularPay: number;
  overtimePay: number;
  supplementalPay: number;
  oneTimePayments: number;
  lumpSumPay: number;
  retroactivePay: number;
  clothingPay: number;
  cashInLieu: number;
}

export interface QuarterlyPoint {
  year: number;
  quarter: number;
  label: string; // e.g. "Q1 2024"
  totalPayroll: number;
  headcount: number;
}

export interface GovernmentStats {
  year: number;
  headcount: number;
  totalPayroll: number;
  medianSalary: number;
  avgSalary: number;
  agencyCount: number;
  titleCount: number;
  payBreakdown: PayBreakdown;
  quarterlyTrend: QuarterlyPoint[];
}

export interface AgencyStats {
  name: string;
  slug: string;
  headcount: number;
  totalPayroll: number;
  medianSalary: number;
  avgOvertimePay: number;
}

export interface AgencyDetail extends AgencyStats {
  rank: number; // rank among all agencies by headcount
  topTitles: { title: string; slug: string; count: number }[];
  topEarners: EmployeeRecord[];
  salaryValues: number[]; // for histogram
  allTitles: { title: string; slug: string; count: number; medianSalary: number }[];
  payBreakdown: PayBreakdown;
  quarterlyTrend: QuarterlyPoint[];
  allAgenciesMedians: { name: string; slug: string; medianSalary: number }[];
}

export interface TitleStats {
  name: string;
  slug: string;
  count: number;
  medianSalary: number;
  p25: number;
  p75: number;
  minSalary: number;
  maxSalary: number;
}

export interface TitleDetail extends TitleStats {
  agencyDistribution: { agency: string; slug: string; count: number }[];
  employees: EmployeeRecord[];
  salaryValues: number[]; // for histogram / box plot
  payBreakdown: PayBreakdown;
  similarTitles: { name: string; slug: string; medianSalary: number }[];
}

export interface EmployeeRecord {
  payrollId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  agency: string;
  agencySlug: string;
  section: string;
  title: string;
  titleSlug: string;
  salaryHourlyRate: number;
  compensationMethod: string;
  employeeRelationsGroup: string;
  hireDate: string | null;
  ytdEarnings: number;
  regularPay: number;
  overtimePay: number;
  otherPay: number;
  year: number;
  quarter: number;
}

export interface EmployeeDetail extends EmployeeRecord {
  payBreakdown: PayBreakdown;
  titlePercentile: number; // 0–100
  agencyPercentile: number; // 0–100
  titleDistribution: number[]; // salary values for histogram
  agencyDistribution: number[]; // salary values for histogram
}

export interface SearchResult {
  type: 'agency' | 'title' | 'employee';
  label: string;
  sublabel: string;
  href: string;
}

// Raw Socrata record shape (MASTER records)
export interface SocrataRecord {
  calendar_year: string;
  calendar_quarter: string;
  as_of_date: string;
  payroll_id: string;
  last_name: string;
  first_name: string;
  middle_initial: string;
  full_name: string;
  original_employment_dte: string;
  salary_hourly_rate: string;
  master_department_agency_desc: string;
  master_section_desc: string;
  master_title_desc: string;
  employee_relations_group: string;
  compensation_method: string;
  master_ytd_regular_pay: string;
  master_ytd_overtime_payments: string;
  master_ytd_all_other_payments: string;
  master_ytd_earnings: string;
  record_type: string;
}

// Raw Socrata record shape (DETAIL records)
export interface SocrataDetailRecord {
  calendar_year: string;
  calendar_quarter: string;
  payroll_id: string;
  full_name: string;
  paid_department_agency_desc: string;
  paid_section_desc: string;
  regular_pay: string;
  supplemental_pay: string;
  one_time_payments: string;
  legislator_or_back_pay: string;
  overtime_payments: string;
  clothing_uniform_payments: string;
  retroactive_pay: string;
  lump_sum_pay: string;
  cash_in_lieu_maintenance: string;
  ytd_earnings: string;
  record_type: string;
}
