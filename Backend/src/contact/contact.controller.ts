import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('contacts')
@UseGuards(AuthGuard)
export class ContactController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async getContacts() {
    const items = await this.prisma.contact.findMany({
      orderBy: { name: 'asc' },
      include: {
        linkedUser: {
          select: { role: true, email: true },
        },
      },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email || item.linkedUser?.email || '',
      avatar: item.avatar,
      linkedUserRole: item.linkedUser?.role || null,
    }));

    return { data: formatted };
  }
}
