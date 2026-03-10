import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SchedulingEngineService } from './scheduling-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('scheduling-engine')
export class SchedulingEngineController {
    constructor(private readonly schedulingEngineService: SchedulingEngineService) { }

    /**
     * GET /scheduling-engine/slots?institutionId=&serviceId=&date=YYYY-MM-DD&branchId=
     * Returns available time slots (HH:MM) for the given institution/branch/service/date
     */
    @Get('slots')
    getSlots(
        @Query('institutionId') institutionId: string,
        @Query('serviceId') serviceId: string,
        @Query('date') date: string,
        @Query('branchId') branchId?: string,
    ) {
        return this.schedulingEngineService.getAvailableSlots({
            institutionId,
            branchId: branchId || undefined,
            serviceId,
            date,
        });
    }
}
