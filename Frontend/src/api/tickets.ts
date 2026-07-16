import { api } from '../lib/api';
import type { Ticket, TicketsQuery, Paginated, TicketStatus } from '../types/api';

interface ApiEnvelope<T> {
  data: T;
}

function toParams(query: TicketsQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (query.status) params.status = query.status;
  if (query.search) params.search = query.search;
  if (query.page) params.page = query.page;
  return params;
}

export async function listTickets(query: TicketsQuery): Promise<Paginated<Ticket>> {
  const res = await api.get<Paginated<Ticket>>('/tickets', { params: toParams(query) });
  return res.data;
}

export async function exportTickets(query: TicketsQuery): Promise<Ticket[]> {
  const params = toParams(query);
  params.export = 'true';
  const res = await api.get<{ data: Ticket[] }>('/tickets', { params });
  return res.data.data;
}

export async function getTicket(id: string): Promise<Ticket> {
  const res = await api.get<ApiEnvelope<Ticket>>(`/tickets/${id}`);
  return res.data.data;
}

export async function createTicket(input: {
  customer_name: string;
  customer_email: string;
  subject: string;
  description: string;
}): Promise<Ticket> {
  const res = await api.post<ApiEnvelope<Ticket>>('/tickets', input);
  return res.data.data;
}

export async function updateTicket(
  id: string,
  input: { status?: TicketStatus; notes?: string },
): Promise<{ success: boolean; updated_at: string }> {
  const res = await api.put<{ success: boolean; updated_at: string }>(`/tickets/${id}`, input);
  return res.data;
}
