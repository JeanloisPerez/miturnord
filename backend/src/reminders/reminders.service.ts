import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry, Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class RemindersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RemindersService.name);
  private readonly CRON_NAME = 'dynamic_reminder_interval';

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onApplicationBootstrap() {
    await this.configureCron();
  }

  /**
   * Called on startup or when SAAS_ADMIN updates the SystemSetting
   */
  async configureCron() {
    // 1. Fetch system settings
    let setting = await this.prisma.systemSetting.findUnique({ where: { id: 'singleton' } });
    if (!setting) {
      setting = await this.prisma.systemSetting.create({ data: { id: 'singleton' } });
    }

    const { cron_reminder_frequency_minutes } = setting;
    const intervalMs = cron_reminder_frequency_minutes * 60 * 1000;

    // 2. Clear existing interval if present
    if (this.schedulerRegistry.getIntervals().includes(this.CRON_NAME)) {
      this.schedulerRegistry.deleteInterval(this.CRON_NAME);
      this.logger.log('Previous reminder interval deleted.');
    }

    // 3. Register new interval
    const interval = setInterval(async () => {
      await this.processReminders();
    }, intervalMs);

    this.schedulerRegistry.addInterval(this.CRON_NAME, interval);
    this.logger.log(`Reminder interval scheduled to run every ${cron_reminder_frequency_minutes} minutes.`);
  }

  /**
   * Main cron job logic to process due reminders
   */
  private async processReminders() {
    this.logger.log('Processing automated appointment reminders...');

    const now = new Date();
    // Broad window to check upcoming appointments (e.g. next 14 days)
    const maxLookahead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const pendingAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        reminder_sent: false,
        date: {
          gt: now,
          lte: maxLookahead
        }
      },
      include: {
        institution: { include: { business_rule: true } },
        user: true,
        service: true
      }
    });

    for (const appt of pendingAppointments) {
      const daysBefore = appt.institution.business_rule?.reminder_days_before ?? 1;
      const targetReminderDate = new Date(appt.date.getTime() - daysBefore * 24 * 60 * 60 * 1000);

      // If we have passed the target reminder date, send it now!
      if (now >= targetReminderDate) {
        let success = false;
        let errorMsg = '';

        let recipientEmail = '';

        try {
          recipientEmail = appt.user?.email ?? appt.walk_in_email ?? '';
          const recipientName = appt.user?.full_name ?? appt.walk_in_name ?? 'Cliente';

          if (recipientEmail) {
            const formattedDate = appt.date.toLocaleString('es-DO', { dateStyle: 'full', timeStyle: 'short', hour12: false });
            success = await this.emailsService.sendAppointmentConfirmation(
              recipientEmail,
              recipientName,
              formattedDate,
              appt.service.name + ' (RECORDATORIO)', // Modify slightly or create a new email template in EmailService
              appt.institution.name
            );
          } else {
            errorMsg = 'Usuario sin email';
          }
        } catch (e: any) {
          errorMsg = e.message;
        }

        // Always mark as sent to prevent re-processing
        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { reminder_sent: true }
        });

        // Log the operation
        await this.prisma.reminderLog.create({
          data: {
            appointment_id: appt.id,
            user_email: recipientEmail || 'No email',
            status: success ? 'SUCCESS' : 'FAILED',
            error_details: success ? null : errorMsg,
          }
        });
      }
    }
    
    this.logger.log('Finished processing automated appointment reminders.');
  }

  /**
   * Runs daily at midnight to purge logs older than the system threshold
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'purge_reminder_logs' })
  async purgeLogs() {
    this.logger.log('Starting ReminderLog purge process...');
    
    const setting = await this.prisma.systemSetting.findUnique({ where: { id: 'singleton' } });
    const retentionDays = setting?.log_retention_days ?? 7;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

    const result = await this.prisma.reminderLog.deleteMany({
      where: {
        created_at: { lt: thresholdDate }
      }
    });

    this.logger.log(`Purged ${result.count} old reminder logs.`);
  }
}
