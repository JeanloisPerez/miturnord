import { Module } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsController } from './system-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [PrismaModule, RemindersModule],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService],
})
export class SystemSettingsModule {}
