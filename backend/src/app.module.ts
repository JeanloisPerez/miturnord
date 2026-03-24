import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { InstitutionTypesModule } from './institution-types/institution-types.module';
import { ServicesModule } from './services/services.module';
import { SchedulesModule } from './schedules/schedules.module';
import { BranchesModule } from './branches/branches.module';
import { SchedulingEngineModule } from './scheduling-engine/scheduling-engine.module';
import { BusinessRulesModule } from './business-rules/business-rules.module';
import { BlockedTimesModule } from './blocked-times/blocked-times.module';
import { ReportsModule } from './reports/reports.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { EmailsModule } from './emails/emails.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from './reminders/reminders.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    InstitutionTypesModule,
    InstitutionsModule,
    ServicesModule,
    SchedulesModule,
    AppointmentsModule,
    BranchesModule,
    SchedulingEngineModule,
    BusinessRulesModule,
    BlockedTimesModule,
    ReportsModule,
    UploadModule,
    UsersModule,
    CustomFieldsModule,
    EmailsModule,
    RemindersModule,
    SystemSettingsModule,
  ],
})
export class AppModule { }