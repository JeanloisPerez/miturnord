import { Module } from '@nestjs/common';
import { SchedulingEngineController } from './scheduling-engine.controller';
import { SchedulingEngineService } from './scheduling-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';

@Module({
    imports: [PrismaModule, GoogleCalendarModule],
    controllers: [SchedulingEngineController],
    providers: [SchedulingEngineService],
    exports: [SchedulingEngineService],
})
export class SchedulingEngineModule { }
