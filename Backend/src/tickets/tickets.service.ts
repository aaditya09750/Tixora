import { Injectable, NotFoundException, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

export interface CreateTicketDto {
  customer_name: string;
  customer_email: string;
  subject: string;
  description: string;
  channel?: string;
}

export interface UpdateTicketDto {
  status?: string;
  notes?: string;
}

@Injectable()
export class TicketsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: CreateTicketDto, userId: string) {
    const tempTicket = await this.prisma.ticket.create({
      data: {
        ticket_id: 'TEMP-' + Math.random().toString(36).slice(2, 9),
        customer_name: dto.customer_name,
        customer_email: dto.customer_email.toLowerCase().trim(),
        subject: dto.subject,
        description: dto.description,
        status: 'Open',
        channel: dto.channel || 'Portal',
        created_by_id: userId,
      },
    });

    const finalId = `TIX-${1000 + tempTicket.id_seq}`;

    const ticket = await this.prisma.ticket.update({
      where: { id: tempTicket.id },
      data: { ticket_id: finalId },
    });

    await this.prisma.activity.create({
      data: {
        actor_id: userId,
        action: `Created ticket ${ticket.ticket_id} for ${ticket.customer_name}`,
      },
    });

    await this.prisma.notification.create({
      data: {
        kind: 'user',
        message: `New ticket created by ${ticket.customer_name}: ${ticket.ticket_id}`,
        audience: 'all',
      },
    });

    return ticket;
  }

  async findAll(
    query: { status?: string; search?: string; page?: number },
    user?: { id: string; role: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    if (user && user.role !== 'admin') {
      where.created_by_id = user.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { customer_name: { contains: searchLower, mode: 'insensitive' } },
        { customer_email: { contains: searchLower, mode: 'insensitive' } },
        { ticket_id: { contains: searchLower, mode: 'insensitive' } },
        { subject: { contains: searchLower, mode: 'insensitive' } },
        { description: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findFirstAdmin() {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'admin' },
    });
    if (!admin) {
      const user = await this.prisma.user.findFirst();
      if (!user) {
        throw new NotFoundException('No user found in database');
      }
      return user;
    }
    return admin;
  }

  async findAllUnpaginated(
    query: { status?: string; search?: string },
    user?: { id: string; role: string },
  ) {
    const where: Prisma.TicketWhereInput = {};

    if (user && user.role !== 'admin') {
      where.created_by_id = user.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { customer_name: { contains: searchLower, mode: 'insensitive' } },
        { customer_email: { contains: searchLower, mode: 'insensitive' } },
        { ticket_id: { contains: searchLower, mode: 'insensitive' } },
        { subject: { contains: searchLower, mode: 'insensitive' } },
        { description: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByTicketId(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticket_id: ticketId },
      include: {
        notes: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    return ticket;
  }

  async update(ticketId: string, dto: UpdateTicketDto, userId: string, userRole?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticket_id: ticketId },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (userRole && userRole !== 'admin' && ticket.created_by_id !== userId) {
      throw new ForbiddenException('You do not have permission to update this ticket');
    }

    const updateData: Prisma.TicketUpdateInput = {};
    if (dto.status) {
      updateData.status = dto.status;
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { ticket_id: ticketId },
      data: updateData,
    });

    if (dto.notes && dto.notes.trim().length > 0) {
      await this.prisma.note.create({
        data: {
          ticket_id: ticketId,
          note_text: dto.notes.trim(),
        },
      });
    }

    let actionLog = `Updated ticket ${ticketId}`;
    if (dto.status && dto.notes) {
      actionLog = `Changed status of ${ticketId} to ${dto.status} and added a comment`;
    } else if (dto.status) {
      actionLog = `Changed status of ${ticketId} to ${dto.status}`;
    } else if (dto.notes) {
      actionLog = `Added a comment to ticket ${ticketId}`;
    }

    await this.prisma.activity.create({
      data: {
        actor_id: userId,
        action: actionLog,
      },
    });

    if (dto.status || (dto.notes && dto.notes.trim().length > 0)) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId } });
      const actorName = actor ? actor.name : 'User';

      let msg = '';
      let kind = 'lead-status';

      if (dto.status && dto.notes && dto.notes.trim().length > 0) {
        msg = `${actorName} changed status of ${ticketId} to ${dto.status} and added a comment`;
        kind = 'lead-status';
      } else if (dto.status) {
        msg = `${actorName} changed status of ${ticketId} to ${dto.status}`;
        kind = 'lead-status';
      } else if (dto.notes && dto.notes.trim().length > 0) {
        msg = `${actorName} added an internal note to ticket ${ticketId}`;
        kind = 'bug';
      }

      await this.prisma.notification.create({
        data: {
          kind,
          message: msg,
          audience: 'all',
        },
      });
    }

    return updatedTicket;
  }
}
