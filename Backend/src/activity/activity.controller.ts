import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('activities')
@UseGuards(AuthGuard)
export class ActivityController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async getActivities() {
    const items = await this.prisma.activity.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
      include: {
        actor: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      actorName: item.actor.name,
      actorEmail: item.actor.email,
      actorRole: item.actor.role,
      action: item.action,
      created_at: item.created_at,
    }));

    return { data: formatted };
  }
}
