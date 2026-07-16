import { Briefcase, Trophy, Users, type LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/feedback/Skeleton';
import { cn } from '../../lib/utils';
import type { TeamSummary as TeamSummaryData } from '../../types/team';

interface Props {
  summary?: TeamSummaryData;
  loading: boolean;
}

interface Tile {
  label: string;
  value: string;
  sub: string;
  Icon: ComponentType<LucideProps>;
  bg: string;
}

export const TeamSummary = ({ summary, loading }: Props) => {
  if (loading || !summary) {
    return (
      <div className="flex flex-wrap gap-4 md:gap-5 px-4 md:px-7 py-5 md:py-7">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="w-full sm:w-[270px] h-[96px] rounded-xl" />
        ))}
      </div>
    );
  }

  const TEAM_ICON_STYLES: Record<string, string> = {
    'Total members': 'bg-blue-50 text-blue-600 dark:bg-black/10 dark:text-ink',
    'Total tickets': 'bg-orange-50 text-orange-600 dark:bg-black/10 dark:text-ink',
    'Top performer': 'bg-emerald-50 text-emerald-600 dark:bg-black/10 dark:text-ink',
  };

  const tiles: Tile[] = [
    {
      label: 'Total members',
      value: String(summary.totalMembers),
      sub: `${summary.adminCount} admin · ${summary.devsCount} devs`,
      Icon: Users,
      bg: 'bg-stat-views',
    },
    {
      label: 'Total tickets',
      value: String(summary.totalLeads),
      sub: 'across the team',
      Icon: Briefcase,
      bg: 'bg-stat-visits',
    },
    {
      label: 'Top performer',
      value: summary.topPerformer?.name ?? '—',
      sub: summary.topPerformer
        ? `${summary.topPerformer.totalLeads} ticket${summary.topPerformer.totalLeads === 1 ? '' : 's'}`
        : 'no tickets yet',
      Icon: Trophy,
      bg: 'bg-stat-newUsers',
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 md:gap-5 px-4 md:px-7 py-5 md:py-7">
      {tiles.map((t) => (
        <Card
          key={t.label}
          className={cn(
            'flex items-center gap-4 w-full sm:w-[270px] flex-shrink-0 border border-border',
            t.bg,
          )}
        >
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
              TEAM_ICON_STYLES[t.label] ?? 'bg-black/10 text-ink',
            )}
          >
            <t.Icon size={22} strokeWidth={1.75} />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-ink text-sm font-semibold leading-none">{t.label}</span>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-display text-ink text-2xl font-bold leading-none truncate">
                {t.value}
              </span>
              <span className="text-ink text-xs truncate">{t.sub}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
