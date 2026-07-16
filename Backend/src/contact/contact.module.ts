import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ContactController],
})
export class ContactModule {}
