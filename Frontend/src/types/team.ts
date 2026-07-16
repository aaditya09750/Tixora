import type { Role } from './api';

export interface TeamLeadCounts {
  total: number;
  byStatus: Record<'New' | 'Contacted' | 'Qualified' | 'Lost', number>;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  leadCounts: TeamLeadCounts;
}

export interface TeamSummary {
  totalMembers: number;
  adminCount: number;
  devsCount: number;
  totalLeads: number;
  topPerformer: { id: string; name: string; email: string; totalLeads: number } | null;
}

export interface TeamOverview {
  summary: TeamSummary;
  members: TeamMember[];
}
