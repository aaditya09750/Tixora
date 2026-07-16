import { Controller, Get, Res, Inject } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(@Res() res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'ok',
        service: 'tixora-api',
        uptime: process.uptime(),
        db: 'connected',
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        service: 'tixora-api',
        uptime: process.uptime(),
        db: 'disconnected',
      });
    }
  }
}
