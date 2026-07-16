import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  resolvePeriod,
  bucketIndex,
  last12MonthsAxis,
  last12MonthsBucket,
  PeriodKey,
} from '../lib/periods.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(userId: string, userRole: string, periodKey: PeriodKey) {
    const now = new Date();
    const range = resolvePeriod(periodKey, now);

    const baseMatch: Prisma.TicketWhereInput = {};
    if (userRole !== 'admin') {
      baseMatch.created_by_id = userId;
    }

    const currentTickets = await this.prisma.ticket.findMany({
      where: {
        ...baseMatch,
        created_at: {
          gte: range.from,
          lt: range.to,
        },
      },
    });

    const previousTickets = range.hasPrevious
      ? await this.prisma.ticket.findMany({
          where: {
            ...baseMatch,
            created_at: {
              gte: range.previousFrom,
              lt: range.previousTo,
            },
          },
        })
      : [];

    const monthlyStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyTickets = await this.prisma.ticket.findMany({
      where: {
        ...baseMatch,
        created_at: {
          gte: monthlyStart,
        },
      },
    });

    const currentCount = currentTickets.length;
    const previousCount = previousTickets.length;

    const currentOpen = currentTickets.filter((t) => t.status === 'Open').length;
    const previousOpen = previousTickets.filter((t) => t.status === 'Open').length;

    const currentInProgress = currentTickets.filter((t) => t.status === 'In Progress').length;
    const previousInProgress = previousTickets.filter((t) => t.status === 'In Progress').length;

    const currentClosed = currentTickets.filter((t) => t.status === 'Closed').length;
    const previousClosed = previousTickets.filter((t) => t.status === 'Closed').length;

    const pctDelta = (curr: number, prev: number) => {
      if (prev === 0 && curr === 0) return { change: '0%', positive: true };
      if (prev === 0) return { change: '+100%', positive: true };
      const pct = ((curr - prev) / prev) * 100;
      const rounded = Math.round(pct * 10) / 10;
      return {
        change: `${rounded >= 0 ? '+' : ''}${rounded.toFixed(1)}%`,
        positive: rounded >= 0,
      };
    };

    const mkDelta = (curr: number, prev: number) =>
      range.hasPrevious ? pctDelta(curr, prev) : { change: '', positive: true };

    const formatCount = (n: number) => n.toLocaleString();

    const kpis = [
      {
        key: 'totalLeads',
        title: 'Total Tickets',
        value: formatCount(currentCount),
        ...mkDelta(currentCount, previousCount),
        bgKey: 'views',
      },
      {
        key: 'newLeads',
        title: 'Open',
        value: formatCount(currentOpen),
        ...mkDelta(currentOpen, previousOpen),
        bgKey: 'visits',
      },
      {
        key: 'qualifiedLeads',
        title: 'In Progress',
        value: formatCount(currentInProgress),
        ...mkDelta(currentInProgress, previousInProgress),
        bgKey: 'newUsers',
      },
      {
        key: 'conversionRate',
        title: 'Closed',
        value: formatCount(currentClosed),
        ...mkDelta(currentClosed, previousClosed),
        bgKey: 'activeUsers',
      },
    ];

    const len = range.bucketLabels.length;
    const currentTotalBucket = new Array<number>(len).fill(0);
    const currentOpenBucket = new Array<number>(len).fill(0);
    const currentClosedBucket = new Array<number>(len).fill(0);

    const previousTotalBucket = new Array<number>(len).fill(0);
    const previousOpenBucket = new Array<number>(len).fill(0);
    const previousClosedBucket = new Array<number>(len).fill(0);

    for (const t of currentTickets) {
      const idx = bucketIndex(t.created_at, range, 'current', now);
      if (idx >= 0 && idx < len) {
        currentTotalBucket[idx] = (currentTotalBucket[idx] ?? 0) + 1;
        if (t.status === 'Open') currentOpenBucket[idx] = (currentOpenBucket[idx] ?? 0) + 1;
        if (t.status === 'Closed') currentClosedBucket[idx] = (currentClosedBucket[idx] ?? 0) + 1;
      }
    }

    for (const t of previousTickets) {
      const idx = bucketIndex(t.created_at, range, 'previous', now);
      if (idx >= 0 && idx < len) {
        previousTotalBucket[idx] = (previousTotalBucket[idx] ?? 0) + 1;
        if (t.status === 'Open') previousOpenBucket[idx] = (previousOpenBucket[idx] ?? 0) + 1;
        if (t.status === 'Closed') previousClosedBucket[idx] = (previousClosedBucket[idx] ?? 0) + 1;
      }
    }

    const makeChart = (curr: number[], prev: number[]) => ({
      xAxis: range.bucketLabels,
      series: [
        { name: 'Current', data: curr, color: '#C6C7F8', dashed: false },
        { name: 'Previous', data: prev, color: '#A8C5DA', dashed: true },
      ],
    });

    const pivots = {
      totalLeads: makeChart(currentTotalBucket, previousTotalBucket),
      qualified: makeChart(currentOpenBucket, previousOpenBucket),
      conversion: makeChart(currentClosedBucket, previousClosedBucket),
    };

    const statusCounts = {
      Open: currentOpen,
      'In Progress': currentInProgress,
      Closed: currentClosed,
    };
    const maxStatus = Math.max(...Object.values(statusCounts), 1);
    const trafficByWebsite = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: Math.round((count / maxStatus) * 100),
      active: count > 0 && count === maxStatus,
    }));

    const channelCounts = {
      Portal: 0,
      SocialMedia: 0,
      Email: 0,
    };

    currentTickets.forEach((t) => {
      if (t.channel === 'Social Media') {
        channelCounts.SocialMedia++;
      } else if (t.channel === 'Email') {
        channelCounts.Email++;
      } else {
        channelCounts.Portal++;
      }
    });

    const maxChannel = Math.max(...Object.values(channelCounts), 1);
    const trafficByDevice = [
      {
        label: 'Portal',
        value: Math.round((channelCounts.Portal / maxChannel) * 100),
        color: 'sky',
      },
      {
        label: 'Social Media',
        value: Math.round((channelCounts.SocialMedia / maxChannel) * 100),
        color: 'purple',
      },
      {
        label: 'Email',
        value: Math.round((channelCounts.Email / maxChannel) * 100),
        color: 'green',
      },
    ];

    const assigneeMap = new Map<string, number>();
    currentTickets.forEach((t) => {
      assigneeMap.set(t.created_by_id, (assigneeMap.get(t.created_by_id) || 0) + 1);
    });

    const assigneeCounts = Array.from(assigneeMap.entries()).map(([id, count]) => ({ id, count }));
    assigneeCounts.sort((a, b) => b.count - a.count);

    const topAssignees = assigneeCounts.slice(0, 4);
    const totalAssigneesCount = assigneeCounts.reduce((sum, item) => sum + item.count, 0);

    const userDetails = await this.prisma.user.findMany({
      where: { id: { in: topAssignees.map((x) => x.id) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(userDetails.map((u) => [u.id, u.name]));

    const colors = ['purple', 'green', 'indigo', 'sky', 'teal'];
    const trafficByLocation = topAssignees.map((item, i) => ({
      country: nameMap.get(item.id) || 'Unknown',
      percentage:
        totalAssigneesCount === 0 ? 0 : Math.round((item.count / totalAssigneesCount) * 1000) / 10,
      color: colors[i % colors.length] || 'purple',
    }));

    const { labels } = last12MonthsAxis(now);
    const monthlyCounts = new Array<number>(labels.length).fill(0);
    for (const t of monthlyTickets) {
      const idx = last12MonthsBucket(t.created_at, now);
      if (idx >= 0 && idx < monthlyCounts.length) {
        monthlyCounts[idx] = (monthlyCounts[idx] ?? 0) + 1;
      }
    }
    const maxMonthly = Math.max(...monthlyCounts, 1);
    const marketingMonthly = labels.map((month, i) => {
      const count = monthlyCounts[i] || 0;
      return {
        month,
        value: Math.round((count / maxMonthly) * 100),
        color: colors[i % colors.length] || 'indigo',
        count,
      };
    });

    return {
      period: {
        key: range.key,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      kpis,
      userChart: {
        ...pivots.totalLeads,
        pivots,
      },
      trafficByWebsite,
      trafficByDevice,
      trafficByLocation,
      marketingMonthly,
    };
  }
}
