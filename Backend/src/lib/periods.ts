export const PERIOD_KEYS = ['today', 'week', 'month', 'last30', 'year', 'all'] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];

export type BucketKind =
  | 'hour4'
  | 'dayOfWeek'
  | 'weekOfMonth'
  | 'fiveDay'
  | 'monthOfYear'
  | 'last12Months';

export interface PeriodRange {
  key: PeriodKey;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  hasPrevious: boolean;
  bucket: BucketKind;
  bucketLabels: string[];
}

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  last30: 'Last 30 Days',
  year: 'This Year',
  all: 'All Time',
};

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

const DAY_NAMES_MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const out = startOfDay(d);
  out.setDate(out.getDate() - diff);
  return out;
}

function shortDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function resolvePeriod(key: PeriodKey, now: Date = new Date()): PeriodRange {
  switch (key) {
    case 'today': {
      const from = startOfDay(now);
      const to = now;
      const length = to.getTime() - from.getTime();
      const previousFrom = new Date(from.getTime() - DAY_MS);
      const previousTo = new Date(previousFrom.getTime() + length);
      return {
        key,
        from,
        to,
        previousFrom,
        previousTo,
        hasPrevious: true,
        bucket: 'hour4',
        bucketLabels: ['12am', '4am', '8am', '12pm', '4pm', '8pm'],
      };
    }
    case 'week': {
      const from = startOfWeek(now);
      const to = now;
      const previousFrom = new Date(from.getTime() - 7 * DAY_MS);
      const previousTo = from;
      return {
        key,
        from,
        to,
        previousFrom,
        previousTo,
        hasPrevious: true,
        bucket: 'dayOfWeek',
        bucketLabels: [...DAY_NAMES_MON_FIRST],
      };
    }
    case 'month': {
      const from = startOfMonth(now);
      const to = now;
      const previousFrom = new Date(from.getFullYear(), from.getMonth() - 1, 1);
      const previousTo = from;
      return {
        key,
        from,
        to,
        previousFrom,
        previousTo,
        hasPrevious: true,
        bucket: 'weekOfMonth',
        bucketLabels: ['W1', 'W2', 'W3', 'W4', 'W5'],
      };
    }
    case 'last30': {
      const to = now;
      const from = new Date(to.getTime() - 30 * DAY_MS);
      const previousTo = from;
      const previousFrom = new Date(previousTo.getTime() - 30 * DAY_MS);

      const labels: string[] = [];
      for (let i = 0; i < 6; i++) {
        labels.push(shortDate(new Date(from.getTime() + i * 5 * DAY_MS)));
      }
      return {
        key,
        from,
        to,
        previousFrom,
        previousTo,
        hasPrevious: true,
        bucket: 'fiveDay',
        bucketLabels: labels,
      };
    }
    case 'year': {
      const from = startOfYear(now);
      const to = now;
      const previousFrom = new Date(from.getFullYear() - 1, 0, 1);
      const previousTo = from;
      return {
        key,
        from,
        to,
        previousFrom,
        previousTo,
        hasPrevious: true,
        bucket: 'monthOfYear',
        bucketLabels: [...MONTH_NAMES],
      };
    }
    case 'all': {
      const to = now;
      const from = new Date(0);
      const labels: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(MONTH_NAMES[d.getMonth()] ?? '');
      }
      return {
        key,
        from,
        to,
        previousFrom: new Date(0),
        previousTo: new Date(0),
        hasPrevious: false,
        bucket: 'last12Months',
        bucketLabels: labels,
      };
    }
    default: {
      const _exhaustive: never = key;
      throw new Error(`Unhandled period key: ${String(_exhaustive)}`);
    }
  }
}

export function bucketIndex(
  date: Date,
  range: PeriodRange,
  which: 'current' | 'previous',
  now: Date = new Date(),
): number {
  switch (range.bucket) {
    case 'hour4':
      return Math.min(5, Math.max(0, Math.floor(date.getHours() / 4)));
    case 'dayOfWeek': {
      const day = date.getDay();
      return (day + 6) % 7;
    }
    case 'weekOfMonth':
      return Math.min(4, Math.max(0, Math.floor((date.getDate() - 1) / 7)));
    case 'fiveDay': {
      const base = which === 'current' ? range.from : range.previousFrom;
      const days = Math.floor((date.getTime() - base.getTime()) / DAY_MS);
      return Math.min(5, Math.max(0, Math.floor(days / 5)));
    }
    case 'monthOfYear':
      return date.getMonth();
    case 'last12Months': {
      const monthsDiff =
        (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      const idx = 11 - monthsDiff;
      return idx >= 0 && idx <= 11 ? idx : -1;
    }
    default: {
      const _exhaustive: never = range.bucket;
      throw new Error(`Unhandled bucket kind: ${String(_exhaustive)}`);
    }
  }
}

export function last12MonthsAxis(now: Date = new Date()): { labels: string[]; starts: Date[] } {
  const labels: string[] = [];
  const starts: Date[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    starts.push(d);
    labels.push(MONTH_NAMES[d.getMonth()] ?? '');
  }
  return { labels, starts };
}

export function last12MonthsBucket(date: Date, now: Date = new Date()): number {
  const monthsDiff =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  const idx = 11 - monthsDiff;
  return idx >= 0 && idx <= 11 ? idx : -1;
}
