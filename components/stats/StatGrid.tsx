import { StatCard } from './StatCard';

export interface Stat {
  label: string;
  value: string;
  subtext?: string;
}

interface Props {
  stats: Stat[];
}

export function StatGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
