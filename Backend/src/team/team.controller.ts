import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { TeamService } from './team.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('team')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class TeamController {
  constructor(@Inject(TeamService) private readonly teamService: TeamService) {}

  @Get()
  async getTeam() {
    const data = await this.teamService.getOverview();
    return { data };
  }
}
