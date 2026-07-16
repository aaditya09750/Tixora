import type { TicketStatus } from '../../types/api';

export const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  Open: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-accent-brand/20 dark:text-accent-brand dark:border-transparent',
  'In Progress':
    'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-accent-purple/20 dark:text-accent-purple dark:border-transparent',
  Closed:
    'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-accent-green/20 dark:text-accent-green dark:border-transparent',
};
