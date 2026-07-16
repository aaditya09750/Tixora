import { Search, Plus, Download } from 'lucide-react';
import { Select, type SelectOption } from '../../components/ui/Select';
import { TICKET_STATUSES, type TicketStatus, type SortOrder } from '../../types/api';

export interface MemberOption {
  email: string;
  name: string;
}

interface TicketFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TicketStatus | '';
  onStatusChange: (value: TicketStatus | '') => void;
  sort: SortOrder;
  onSortChange: (value: SortOrder) => void;
  owner: string;
  onOwnerChange: (email: string) => void;
  members?: MemberOption[];
  onNewTicket: () => void;
  onExport: () => void;
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  ...TICKET_STATUSES.map((s) => ({ value: s, label: s })),
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'latest', label: 'Latest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const halfOnMobile = 'w-[calc(50%-0.375rem)]';

export const TicketFilters = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  owner,
  onOwnerChange,
  members,
  onNewTicket,
  onExport,
}: TicketFiltersProps) => {
  const memberOptions: SelectOption[] | null = members
    ? [
        { value: '', label: 'All agents' },
        ...members.map((m) => ({ value: m.email, label: m.name })),
      ]
    : null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 md:px-7 mb-5 relative z-10">
      <div className="relative w-full md:flex-1 md:min-w-[240px]">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ID, name, email or keyword"
          className="w-full pl-10 pr-3 py-2 rounded-lg bg-primary/5 border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-brand"
        />
      </div>

      <Select
        value={status}
        onChange={(v) => onStatusChange(v as TicketStatus | '')}
        options={STATUS_OPTIONS}
        size="md"
        aria-label="Filter by status"
        className={`${halfOnMobile} md:w-[160px]`}
      />

      {memberOptions ? (
        <Select
          value={owner}
          onChange={onOwnerChange}
          options={memberOptions}
          size="md"
          aria-label="Filter by team member"
          className={`${halfOnMobile} md:w-[180px]`}
        />
      ) : null}

      <Select
        value={sort}
        onChange={(v) => onSortChange(v as SortOrder)}
        options={SORT_OPTIONS}
        size="md"
        aria-label="Sort order"
        className={`${halfOnMobile} md:w-[160px]`}
      />

      <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
        <button
          type="button"
          onClick={onExport}
          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
        >
          <Download size={16} />
          Export
        </button>

        <button
          type="button"
          onClick={onNewTicket}
          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-accent-brand text-white text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={16} />
          Create Ticket
        </button>
      </div>
    </div>
  );
};
