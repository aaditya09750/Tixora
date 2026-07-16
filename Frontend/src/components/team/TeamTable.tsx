import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import type { TeamMember } from '../../types/team';
import type { Role } from '../../types/api';

const ROLE_STYLES: Record<Role, string> = {
  admin:
    'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-accent-purple/20 dark:text-accent-purple dark:border-transparent',
  devs: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-accent-sky/20 dark:text-accent-sky dark:border-transparent',
};

interface Props {
  members: TeamMember[];
}

const STATUS_LABELS = {
  New: 'Open',
  Contacted: 'In Progress',
  Qualified: 'Closed',
  Lost: 'Lost',
} as const;

const StatusCounts = ({ member }: { member: TeamMember }) => (
  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
    {(['New', 'Contacted', 'Qualified'] as const).map((s) => (
      <div key={s} className="flex flex-col items-start">
        <span className="text-secondary text-[10px] uppercase tracking-wider">
          {STATUS_LABELS[s]}
        </span>
        <span className="text-primary font-medium">{member.leadCounts.byStatus[s]}</span>
      </div>
    ))}
  </div>
);

export const TeamTable = ({ members }: Props) => {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <>
      <div className="mx-4 md:mx-7 hidden md:block rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="bg-primary/[0.03]">
            <tr className="text-secondary uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Open</th>
              <th className="px-4 py-3 font-medium text-right">In Progress</th>
              <th className="px-4 py-3 font-medium text-right">Closed</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
                className="border-t border-border hover:bg-primary/[0.02] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={m.avatar} alt={m.name} size="sm" />
                    <div className="flex flex-col">
                      <span className="text-primary font-medium">
                        {m.name}
                        {m.id === currentUserId ? (
                          <span className="text-secondary text-[10px] ml-1.5">(you)</span>
                        ) : null}
                      </span>
                      <span className="text-secondary text-[10px]">{m.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
                      ROLE_STYLES[m.role],
                    )}
                  >
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-primary font-medium">
                  {m.leadCounts.total}
                </td>
                <td className="px-4 py-3 text-right text-secondary">{m.leadCounts.byStatus.New}</td>
                <td className="px-4 py-3 text-right text-secondary">
                  {m.leadCounts.byStatus.Contacted}
                </td>
                <td className="px-4 py-3 text-right text-secondary">
                  {m.leadCounts.byStatus.Qualified}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/tickets?owner=${encodeURIComponent(m.email)}`}
                    className="inline-flex items-center gap-1 text-accent-brand text-xs hover:underline"
                  >
                    View tickets
                    <ChevronRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-4 md:hidden space-y-3">
        {members.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar src={m.avatar} alt={m.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-primary text-sm font-medium truncate">
                    {m.name}
                    {m.id === currentUserId ? (
                      <span className="text-secondary text-[10px] ml-1.5">(you)</span>
                    ) : null}
                  </p>
                  <p className="text-secondary text-[11px] truncate">{m.email}</p>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider shrink-0',
                  ROLE_STYLES[m.role],
                )}
              >
                {m.role}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-border">
              <span className="text-secondary text-[10px] uppercase tracking-wider">Total</span>
              <span className="text-primary text-lg font-display font-semibold">
                {m.leadCounts.total}
              </span>
            </div>

            <StatusCounts member={m} />

            <Link
              to={`/tickets?owner=${encodeURIComponent(m.email)}`}
              className="mt-1 inline-flex items-center gap-1 text-accent-brand text-xs font-medium hover:underline"
            >
              View tickets
              <ChevronRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </>
  );
};
