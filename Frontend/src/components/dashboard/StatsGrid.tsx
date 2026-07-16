import type { ComponentType } from 'react';
import {
  BadgeCheck,
  Eye,
  MousePointerClick,
  Percent,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  type LucideProps,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { KPI_METRICS } from '../../data/dashboardData';
import { useDashboardOverview } from '../../hooks/useDashboard';
import { usePeriodParam } from '../../hooks/usePeriodParam';

const KPI_ICONS: Record<string, ComponentType<LucideProps>> = {
  totalLeads: Users,
  newLeads: Sparkles,
  qualifiedLeads: BadgeCheck,
  conversionRate: Percent,

  views: Eye,
  visits: MousePointerClick,
  newUsers: UserPlus,
  activeUsers: Users,
};

const KPI_ICON_STYLES: Record<string, string> = {
  totalLeads: 'bg-blue-50 text-blue-600 dark:bg-black/10 dark:text-ink',
  newLeads: 'bg-orange-50 text-orange-600 dark:bg-black/10 dark:text-ink',
  qualifiedLeads: 'bg-emerald-50 text-emerald-600 dark:bg-black/10 dark:text-ink',
  conversionRate: 'bg-indigo-50 text-indigo-600 dark:bg-black/10 dark:text-ink',
  views: 'bg-blue-50 text-blue-600 dark:bg-black/10 dark:text-ink',
  visits: 'bg-orange-50 text-orange-600 dark:bg-black/10 dark:text-ink',
  newUsers: 'bg-emerald-50 text-emerald-600 dark:bg-black/10 dark:text-ink',
  activeUsers: 'bg-indigo-50 text-indigo-600 dark:bg-black/10 dark:text-ink',
};

function isZeroValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '0' || trimmed === '0.0%' || trimmed === '0%';
}

export const StatsGrid = () => {
  const [period] = usePeriodParam();
  const { data } = useDashboardOverview(period);
  const stats = data?.kpis ?? KPI_METRICS;
  const allZero = stats.length > 0 && stats.every((s) => isZeroValue(s.value));

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      {allZero ? (
        <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between gap-4">
          <span className="text-secondary text-xs">
            Notice: All metrics are currently zero for the selected period.
          </span>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-4 md:gap-5">
        {stats.map((stat) => {
          const Icon = KPI_ICONS[stat.key] ?? Eye;
          const hasChange = stat.change.trim().length > 0;
          return (
            <Card
              key={stat.key}
              className={cn(
                'flex items-center gap-4 w-full sm:w-[270px] flex-shrink-0 border border-border',
                `bg-stat-${stat.bgKey}`,
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                  KPI_ICON_STYLES[stat.key] ?? 'bg-black/10 text-ink',
                )}
              >
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-ink text-sm font-semibold leading-none">{stat.title}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-ink text-2xl font-bold leading-none">
                    {stat.value}
                  </span>
                  {hasChange ? (
                    <span className="inline-flex items-center gap-0.5 text-ink text-xs">
                      {stat.change}
                      {stat.positive ? (
                        <TrendingUp size={12} className="text-ink" />
                      ) : (
                        <TrendingDown size={12} className="text-ink" />
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
