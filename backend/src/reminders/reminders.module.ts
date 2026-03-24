import { Module, forwardRef } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [PrismaModule, EmailsModule],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
