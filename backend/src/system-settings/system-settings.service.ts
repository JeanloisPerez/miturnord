import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class SystemSettingsService {
  constructor(
    private prisma: PrismaService,
    private remindersService: RemindersService
  ) {}

  async getSettings() {
    let setting = await this.prisma.systemSetting.findUnique({ where: { id: 'singleton' } });
    if (!setting) {
      setting = await this.prisma.systemSetting.create({ data: { id: 'singleton' } });
    }
    return setting;
  }

  async updateSettings(data: { cron_reminder_frequency_minutes?: number; log_retention_days?: number }) {
    const setting = await this.prisma.systemSetting.update({
      where: { id: 'singleton' },
      data,
    });

    // If cron frequency changed, reconfigure the Cron Service!
    if (data.cron_reminder_frequency_minutes !== undefined) {
      await this.remindersService.configureCron();
    }

    return setting;
  }
}
