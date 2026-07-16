import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Query,
  Param,
  UseGuards,
  Inject,
  Headers,
} from '@nestjs/common';
import { TicketsService, CreateTicketDto, UpdateTicketDto } from './tickets.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { GetUser, UserSession } from '../auth/get-user.decorator.js';

@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketsController {
  constructor(@Inject(TicketsService) private readonly ticketsService: TicketsService) {}

  @Post()
  async create(
    @Body() dto: CreateTicketDto,
    @GetUser() user: UserSession,
    @Headers('x-tixora-client') client?: string,
  ) {
    const ticket = await this.ticketsService.create(dto, user.id);
    if (client === 'web') {
      return { data: ticket };
    }
    return {
      ticket_id: ticket.ticket_id,
      created_at: ticket.created_at,
    };
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('export') isExport?: string,
    @GetUser() user?: UserSession,
    @Headers('x-tixora-client') client?: string,
  ) {
    if (client === 'web' && isExport !== 'true') {
      const pageNum = page ? parseInt(page, 10) : 1;
      return this.ticketsService.findAll({ status, search, page: pageNum }, user);
    }
    const tickets = await this.ticketsService.findAllUnpaginated({ status, search }, user);
    if (client === 'web') {
      return { data: tickets };
    }
    return tickets.map((t) => ({
      ticket_id: t.ticket_id,
      customer_name: t.customer_name,
      subject: t.subject,
      status: t.status,
      created_at: t.created_at,
    }));
  }

  @Get(':ticket_id')
  async findOne(@Param('ticket_id') ticketId: string, @Headers('x-tixora-client') client?: string) {
    const ticket = await this.ticketsService.findByTicketId(ticketId);
    if (client === 'web') {
      return { data: ticket };
    }
    return {
      ticket_id: ticket.ticket_id,
      customer_name: ticket.customer_name,
      customer_email: ticket.customer_email,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      notes: ticket.notes.map((n) => ({
        id: n.id,
        ticket_id: n.ticket_id,
        note_text: n.note_text,
        created_at: n.created_at,
      })),
    };
  }

  @Put(':ticket_id')
  async update(
    @Param('ticket_id') ticketId: string,
    @Body() dto: UpdateTicketDto,
    @GetUser() user: UserSession,
  ) {
    const ticket = await this.ticketsService.update(ticketId, dto, user.id, user.role);
    return {
      success: true,
      updated_at: ticket.updated_at,
    };
  }
}
