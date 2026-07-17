import type {
  TrafficMarketingRow,
  UserChartData,
  UserChartPivots,
  NotificationDoc,
  ActivityDoc,
  ContactDoc,
} from '../types/dashboard';

export const NOTIFICATIONS: NotificationDoc[] = [
  {
    id: 'mock-notif-1',
    kind: 'bug',
    message: 'Ticket duplication warning on import.',
    audience: 'admin',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-notif-2',
    kind: 'user',
    message: 'Aaditya Gunjal joined as a support agent.',
    audience: 'admin',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-notif-3',
    kind: 'lead-status',
    message: '3 tickets moved to Closed queue this morning.',
    audience: 'all',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mock-notif-4',
    kind: 'subscribe',
    message: 'You have 12 new Portal-sourced tickets.',
    audience: 'devs',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mock-notif-5',
    kind: 'bug',
    message: 'Weekly CSV export has completed.',
    audience: 'admin',
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mock-notif-6',
    kind: 'lead-status',
    message: 'Weekly summary: 14 new, 5 closed.',
    audience: 'all',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export const ACTIVITIES: ActivityDoc[] = [
  {
    id: 'mock-act-1',
    actorName: 'Admin User',
    actorEmail: 'admin@tixora.local',
    actorRole: 'admin',
    action: 'Released UI performance improvements to production.',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-act-2',
    actorName: 'Dev User',
    actorEmail: 'devs@tixora.local',
    actorRole: 'devs',
    action: 'Updated status of ticket TIX-1002 to In Progress.',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-act-3',
    actorName: 'Aaditya Gunjal',
    actorEmail: 'aadigunjal0975@gmail.com',
    actorRole: 'devs',
    action: 'Added an internal note to ticket TIX-1005.',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mock-act-4',
    actorName: 'Dev User',
    actorEmail: 'devs@tixora.local',
    actorRole: 'devs',
    action: 'Logged in from a new device.',
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mock-act-5',
    actorName: 'Admin User',
    actorEmail: 'admin@tixora.local',
    actorRole: 'admin',
    action: 'Updated CRM system role configurations.',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

export const CONTACTS: ContactDoc[] = [
  {
    id: 'mock-con-1',
    name: 'Admin User',
    email: 'admin@tixora.local',
    avatar: 'https://i.pravatar.cc/150?u=admin',
    linkedUserRole: 'admin',
  },
  {
    id: 'mock-con-2',
    name: 'Dev User',
    email: 'devs@tixora.local',
    avatar: 'https://i.pravatar.cc/150?u=devs',
    linkedUserRole: 'devs',
  },
  {
    id: 'mock-con-3',
    name: 'Aaditya Gunjal',
    email: 'aadigunjal0975@gmail.com',
    avatar: 'https://i.pravatar.cc/150?u=aaditya',
    linkedUserRole: 'devs',
  },
  {
    id: 'mock-con-4',
    name: 'Natali Craig',
    email: 'natali.craig@example.com',
    avatar: 'https://i.pravatar.cc/150?u=natali',
    linkedUserRole: null,
  },
  {
    id: 'mock-con-5',
    name: 'Drew Cano',
    email: 'drew.cano@example.com',
    avatar: 'https://i.pravatar.cc/150?u=drew',
    linkedUserRole: null,
  },
  {
    id: 'mock-con-6',
    name: 'Orlando Diggs',
    email: 'orlando.d@example.com',
    avatar: 'https://i.pravatar.cc/150?u=orlando',
    linkedUserRole: null,
  },
];

export const KPI_METRICS = [
  {
    key: 'totalLeads',
    title: 'Total Leads',
    value: '0',
    change: '',
    positive: true,
    bgKey: 'views',
  },
  {
    key: 'newLeads',
    title: 'New',
    value: '0',
    change: '',
    positive: true,
    bgKey: 'visits',
  },
  {
    key: 'qualifiedLeads',
    title: 'Qualified',
    value: '0',
    change: '',
    positive: true,
    bgKey: 'newUsers',
  },
  {
    key: 'conversionRate',
    title: 'Conversion Rate',
    value: '0.0%',
    change: '',
    positive: true,
    bgKey: 'activeUsers',
  },
] as const;

const EMPTY_USER_CHART: UserChartData = {
  xAxis: [],
  series: [
    { name: 'Current', data: [], color: '#C6C7F8', dashed: false },
    { name: 'Previous', data: [], color: '#A8C5DA', dashed: true },
  ],
};

const EMPTY_PIVOTS: UserChartPivots = {
  totalLeads: EMPTY_USER_CHART,
  qualified: EMPTY_USER_CHART,
  conversion: EMPTY_USER_CHART,
};

export const USER_CHART: UserChartData & { pivots: UserChartPivots } = {
  ...EMPTY_USER_CHART,
  pivots: EMPTY_PIVOTS,
};

export const TRAFFIC_BY_WEBSITE = [
  { name: 'New', value: 0, active: false },
  { name: 'Contacted', value: 0, active: false },
  { name: 'Qualified', value: 0, active: false },
  { name: 'Lost', value: 0, active: false },
] as const;

export const TRAFFIC_BY_DEVICE = [
  { label: 'Website', value: 0, color: 'sky' },
  { label: 'Instagram', value: 0, color: 'purple' },
  { label: 'Referral', value: 0, color: 'green' },
] as const;

export const TRAFFIC_BY_LOCATION: ReadonlyArray<{
  country: string;
  percentage: number;
  color: string;
}> = [];

const MONTHLY_COLOR_CYCLE = ['indigo', 'green', 'purple', 'sky', 'blue', 'teal'] as const;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function rollingMonthlyFallback(): TrafficMarketingRow[] {
  const now = new Date();
  const out: TrafficMarketingRow[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      month: MONTH_NAMES[d.getMonth()] ?? '',
      value: 0,
      color: MONTHLY_COLOR_CYCLE[(11 - i) % MONTHLY_COLOR_CYCLE.length] ?? 'indigo',
      count: 0,
    });
  }
  return out;
}

export const MARKETING_MONTHLY: TrafficMarketingRow[] = rollingMonthlyFallback();
