import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ActivityModule } from './activity/activity.module.js';
import { ContactModule } from './contact/contact.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { HealthModule } from './health/health.module.js';
import { TeamModule } from './team/team.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TicketsModule,
    DashboardModule,
    ActivityModule,
    ContactModule,
    NotificationModule,
    HealthModule,
    TeamModule,
  ],
})
export class AppModule {}
