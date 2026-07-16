import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { extractErrorMessage } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTeam } from '../hooks/useTeam';
import { TicketFilters, type MemberOption } from '../components/tickets/TicketFilters';
import { TicketTable } from '../components/tickets/TicketTable';
import { TicketForm, type TicketFormValues } from '../components/tickets/TicketForm';
import { TicketDetail } from '../components/tickets/TicketDetail';
import { ExportModal } from '../components/tickets/ExportModal';
import { useTicketsQuery, useTicket, useCreateTicket, useUpdateTicket } from '../hooks/useTickets';
import { exportTickets } from '../api/tickets';
import type { TicketsQuery, TicketStatus, SortOrder } from '../types/api';

export const TicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ownerEmail = searchParams.get('owner') ?? '';

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const { data: teamData } = useTeam({ enabled: isAdmin });
  const members: MemberOption[] | undefined = isAdmin
    ? (teamData?.members.map((m) => ({ email: m.email, name: m.name })) ?? [])
    : undefined;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [sort, setSort] = useState<SortOrder>('latest');
  const [page, setPage] = useState(1);

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [ownerEmail, debouncedSearch, status]);

  const query: TicketsQuery = useMemo(() => {
    const trimmedSearch = debouncedSearch.trim();
    return {
      ...(status ? { status } : {}),
      ...(trimmedSearch ? { search: trimmedSearch } : {}),
      ...(ownerEmail ? { owner: ownerEmail } : {}),
      sort,
      page,
    };
  }, [status, debouncedSearch, sort, page, ownerEmail]);

  const { data, isLoading, isError, error, refetch, isFetching } = useTicketsQuery(query);
  const { data: activeTicket } = useTicket(viewingId);

  const createMut = useCreateTicket();
  const updateMut = useUpdateTicket();

  const resetToFirstPage = () => setPage(1);

  const setOwner = (email: string) => {
    const next = new URLSearchParams(searchParams);
    if (email) next.set('owner', email);
    else next.delete('owner');
    setSearchParams(next, { replace: true });
  };

  const handleCreate = async (values: TicketFormValues) => {
    try {
      await createMut.mutateAsync(values);
      toast.success('Ticket created successfully');
      setCreating(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleUpdate = async (id: string, data: { status?: TicketStatus; notes?: string }) => {
    try {
      await updateMut.mutateAsync({ id, data });
      toast.success('Ticket updated successfully');
      setViewingId(null);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'export-toast' });
      const dataToExport = await exportTickets(query);

      if (!dataToExport || dataToExport.length === 0) {
        toast.dismiss('export-toast');
        toast.error('No tickets found to export.');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `tickets-export-${timestamp}.${format}`;

      let blob: Blob;

      if (format === 'csv') {
        const headers = [
          'Ticket ID',
          'Customer Name',
          'Customer Email',
          'Subject',
          'Status',
          'Channel',
          'Created At',
        ];
        const csvRows = dataToExport.map((t) => [
          t.ticket_id,
          t.customer_name,
          t.customer_email,
          t.subject,
          t.status,
          t.channel || 'Portal',
          t.created_at,
        ]);
        const csvContent = [
          headers.join(','),
          ...csvRows.map((row) =>
            row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','),
          ),
        ].join('\n');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      } else {
        const rows = dataToExport.map((t) => [
          t.ticket_id,
          t.customer_name,
          t.customer_email,
          t.subject,
          t.status,
          t.channel || 'Portal',
          t.created_at,
        ]);

        const escapeXml = (str: string) =>
          str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

        const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Tickets">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Ticket ID</Data></Cell>
    <Cell><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell><Data ss:Type="String">Customer Email</Data></Cell>
    <Cell><Data ss:Type="String">Subject</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Channel</Data></Cell>
    <Cell><Data ss:Type="String">Created At</Data></Cell>
   </Row>
   ${rows
     .map(
       (r) => `
   <Row>
    ${r
      .map((val) => `<Cell><Data ss:Type="String">${escapeXml(String(val ?? ''))}</Data></Cell>`)
      .join('')}
   </Row>`,
     )
     .join('')}
  </Table>
 </Worksheet>
</Workbook>`;

        blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
      }

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss('export-toast');
      toast.success(`${format.toUpperCase()} file exported successfully`);
    } catch (err) {
      toast.dismiss('export-toast');
      toast.error(`Export failed: ${extractErrorMessage(err)}`);
    }
  };

  const tickets = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <div className="px-4 md:px-7 pt-5 md:pt-7 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-primary text-xl font-semibold">Tickets</h1>
          <p className="text-secondary text-xs mt-1">
            {meta ? `${meta.total} total` : '—'}
            {isFetching ? ' · refreshing…' : ''}
          </p>
        </div>
      </div>

      <TicketFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          resetToFirstPage();
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          resetToFirstPage();
        }}
        sort={sort}
        onSortChange={(v) => {
          setSort(v);
          resetToFirstPage();
        }}
        owner={ownerEmail}
        onOwnerChange={(email) => {
          setOwner(email);
          resetToFirstPage();
        }}
        members={members}
        onNewTicket={() => setCreating(true)}
        onExport={() => setShowExportModal(true)}
      />

      {isError ? (
        <div className="px-4 md:px-7">
          <ErrorState message={extractErrorMessage(error)} onRetry={() => void refetch()} />
        </div>
      ) : isLoading || tickets.length > 0 ? (
        <TicketTable
          tickets={tickets}
          isLoading={isLoading}
          onSelect={(t) => setViewingId(t.ticket_id)}
        />
      ) : (
        <div className="px-4 md:px-7">
          <EmptyState
            title="No tickets yet"
            description={
              debouncedSearch.trim() || status || ownerEmail
                ? 'No tickets match the current filters.'
                : 'Create a new ticket to start tracking.'
            }
          />
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="px-4 md:px-7 mt-4 flex items-center justify-between text-xs text-secondary">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {viewingId && activeTicket ? (
        <TicketDetail
          ticket={activeTicket}
          onClose={() => setViewingId(null)}
          onUpdate={handleUpdate}
          updating={updateMut.isPending}
        />
      ) : null}

      {creating ? (
        <TicketForm
          submitting={createMut.isPending}
          onSubmit={(v) => void handleCreate(v)}
          onClose={() => setCreating(false)}
        />
      ) : null}

      {showExportModal ? (
        <ExportModal onClose={() => setShowExportModal(false)} onExport={handleExport} />
      ) : null}
    </>
  );
};
