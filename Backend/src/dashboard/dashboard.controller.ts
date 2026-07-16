import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { GetUser, UserSession } from '../auth/get-user.decorator.js';
import { PeriodKey, PERIOD_KEYS } from '../lib/periods.js';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Query('period') period: string, @GetUser() user: UserSession) {
    const periodKey: PeriodKey = PERIOD_KEYS.includes(period as PeriodKey)
      ? (period as PeriodKey)
      : 'month';
    const data = await this.dashboardService.getOverview(user.id, user.role, periodKey);
    return { data };
  }
}
