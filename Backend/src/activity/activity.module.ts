import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ActivityController],
})
export class ActivityModule {}
