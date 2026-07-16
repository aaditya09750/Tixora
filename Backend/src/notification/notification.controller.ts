import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { GetUser, UserSession } from '../auth/get-user.decorator.js';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async getNotifications(@GetUser() user: UserSession) {
    const audiences = ['all'];
    if (user.role === 'admin') {
      audiences.push('admin', 'devs');
    } else {
      audiences.push('devs');
    }

    const items = await this.prisma.notification.findMany({
      where: {
        audience: { in: audiences },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      kind: item.kind,
      message: item.message,
      audience: item.audience,
      created_at: item.created_at,
    }));

    return { data: formatted };
  }
}
