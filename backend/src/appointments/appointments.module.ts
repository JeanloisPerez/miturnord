import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SchedulingEngineModule } from '../scheduling-engine/scheduling-engine.module';

@Module({
  imports: [PrismaModule, SchedulingEngineModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule { }
