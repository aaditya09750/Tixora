import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { TICKET_STATUS_STYLES } from './ticketStatusStyles';
import type { Ticket } from '../../types/api';

interface TicketTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  onSelect: (ticket: Ticket) => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function customerAvatar(email: string): string {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
}

export const TicketTable = ({ tickets, isLoading, onSelect }: TicketTableProps) => {
  return (
    <>
      <div className="mx-4 md:mx-7 hidden md:block rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[768px]">
          <thead className="bg-primary/[0.03]">
            <tr className="text-secondary uppercase tracking-wider">
              <th className="px-4 py-3.5 font-medium">Ticket ID</th>
              <th className="px-4 py-3.5 font-medium">Customer</th>
              <th className="px-4 py-3.5 font-medium">Subject</th>
              <th className="px-4 py-3.5 font-medium">Status</th>
              <th className="px-4 py-3.5 font-medium">Created At</th>
              <th className="px-4 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12">
                  <div className="flex justify-center">
                    <LoadingSpinner label="Loading tickets" />
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-border hover:bg-primary/[0.01] transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-primary font-semibold">
                    {t.ticket_id}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={customerAvatar(t.customer_email)}
                        alt={t.customer_name}
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <span className="text-primary font-medium">{t.customer_name}</span>
                        <span className="text-secondary text-[10px]">{t.customer_email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-primary max-w-[240px] truncate">{t.subject}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                        TICKET_STATUS_STYLES[t.status],
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-secondary">{formatDateTime(t.created_at)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(t)}
                      className="inline-flex items-center gap-1 text-accent-brand text-xs font-semibold hover:underline"
                    >
                      Details
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mx-4 md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 flex justify-center bg-surface rounded-xl border border-border">
            <LoadingSpinner label="Loading tickets" />
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              className="rounded-xl border border-border bg-surface p-4 space-y-3 cursor-pointer hover:border-accent-brand/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-primary text-xs font-bold">{t.ticket_id}</span>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                    TICKET_STATUS_STYLES[t.status],
                  )}
                >
                  {t.status}
                </span>
              </div>

              <div>
                <h4 className="text-primary text-sm font-medium leading-snug">{t.subject}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar src={customerAvatar(t.customer_email)} alt={t.customer_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-primary text-[11px] truncate font-medium">
                      {t.customer_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-border text-[10px] text-secondary">
                <span>{formatDateTime(t.created_at)}</span>
                <span className="text-accent-brand font-semibold flex items-center gap-0.5">
                  Details <ChevronRight size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
