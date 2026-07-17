export type Role = 'admin' | 'devs';

export type TicketStatus = 'Open' | 'In Progress' | 'Closed';
export const TICKET_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Closed'];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  ticket_id: string;
  note_text: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  description: string;
  status: TicketStatus;
  channel?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  notes?: Note[];
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export type SortOrder = 'latest' | 'oldest';

export interface TicketsQuery {
  status?: TicketStatus;
  search?: string;
  sort?: SortOrder;
  page?: number;
  owner?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
