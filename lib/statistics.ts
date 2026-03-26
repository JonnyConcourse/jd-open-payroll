/**
 * Returns the median value of a sorted or unsorted array.
 * Returns 0 for empty arrays.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Returns the value at the given percentile (0–100) of an array.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Returns the percentile rank (0–100) of a value within an array.
 */
export function percentileRank(values: number[], value: number): number {
  if (values.length === 0) return 0;
  const below = values.filter((v) => v < value).length;
  return Math.round((below / values.length) * 100);
}

export interface HistogramBin {
  rangeStart: number;
  rangeEnd: number;
  label: string;
  count: number;
}

/**
 * Computes histogram bins for a salary array.
 * Uses the 1st–99th percentile range to clip outliers.
 * Returns `binCount` equal-width bins.
 */
export function histogramBins(values: number[], binCount = 20): HistogramBin[] {
  if (values.length === 0) return [];

  const p1 = percentile(values, 1);
  const p99 = percentile(values, 99);
  const range = p99 - p1;
  if (range === 0) return [];

  const binWidth = range / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    rangeStart: p1 + i * binWidth,
    rangeEnd: p1 + (i + 1) * binWidth,
    label: formatCurrency(p1 + i * binWidth),
    count: 0,
  }));

  for (const v of values) {
    if (v < p1 || v > p99) continue; // clip outliers
    const idx = Math.min(
      Math.floor((v - p1) / binWidth),
      binCount - 1
    );
    bins[idx].count++;
  }

  return bins;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
