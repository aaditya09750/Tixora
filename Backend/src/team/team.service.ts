import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { User } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview() {
    const users = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    const tickets = await this.prisma.ticket.findMany();

    const userTicketCounts = new Map<
      string,
      { total: number; open: number; inProgress: number; closed: number }
    >();
    users.forEach((u) => {
      userTicketCounts.set(u.id, { total: 0, open: 0, inProgress: 0, closed: 0 });
    });

    tickets.forEach((t) => {
      const counts = userTicketCounts.get(t.created_by_id);
      if (counts) {
        counts.total++;
        if (t.status === 'Open') counts.open++;
        else if (t.status === 'In Progress') counts.inProgress++;
        else if (t.status === 'Closed') counts.closed++;
      }
    });

    const members = users.map((u) => {
      const counts = userTicketCounts.get(u.id) || { total: 0, open: 0, inProgress: 0, closed: 0 };
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(u.email)}`,
        leadCounts: {
          total: counts.total,
          byStatus: {
            New: counts.open,
            Contacted: counts.inProgress,
            Qualified: counts.closed,
            Lost: 0,
          },
        },
      };
    });

    const totalMembers = users.length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const devsCount = users.filter((u) => u.role === 'devs').length;
    const totalLeads = tickets.length;

    let topPerformerUser: User | null = null;
    let maxTickets = -1;

    for (const u of users) {
      const counts = userTicketCounts.get(u.id) || { total: 0 };
      if (counts.total > maxTickets) {
        maxTickets = counts.total;
        topPerformerUser = u;
      }
    }

    const topPerformer = topPerformerUser
      ? {
          id: topPerformerUser.id,
          name: topPerformerUser.name,
          email: topPerformerUser.email,
          totalLeads: maxTickets,
        }
      : null;

    return {
      summary: {
        totalMembers,
        adminCount,
        devsCount,
        totalLeads,
        topPerformer,
      },
      members,
    };
  }
}
