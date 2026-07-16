import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
})
export class NotificationModule {}
