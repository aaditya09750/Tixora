import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { createTicket, getTicket, listTickets, updateTicket } from '../api/tickets';
import type { Ticket, TicketsQuery, TicketStatus, Paginated } from '../types/api';

export const ticketsKeys = {
  all: ['tickets'] as const,
  list: (query: TicketsQuery) => ['tickets', 'list', query] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
};

export function useTicketsQuery(query: TicketsQuery) {
  return useQuery<Paginated<Ticket>>({
    queryKey: ticketsKeys.list(query),
    queryFn: () => listTickets(query),
  });
}

export function useTicket(id: string | null) {
  return useQuery<Ticket>({
    queryKey: ticketsKeys.detail(id ?? ''),
    queryFn: () => getTicket(id as string),
    enabled: Boolean(id),
  });
}

interface CreateInput {
  customer_name: string;
  customer_email: string;
  subject: string;
  description: string;
}

interface UpdateInput {
  id: string;
  data: {
    status?: TicketStatus;
    notes?: string;
  };
}

export function useCreateTicket(): UseMutationResult<Ticket, Error, CreateInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createTicket(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ticketsKeys.all });
      void qc.invalidateQueries({ queryKey: ['team'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTicket(): UseMutationResult<
  { success: boolean; updated_at: string },
  Error,
  UpdateInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateInput) => updateTicket(id, data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ticketsKeys.all });
      void qc.invalidateQueries({ queryKey: ticketsKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: ['team'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
