import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SchedulingEngineService } from './scheduling-engine.service';

@ApiTags('Motor de Reservas - Scheduling Engine')
@Controller('scheduling-engine')
export class SchedulingEngineController {
    constructor(private readonly schedulingEngineService: SchedulingEngineService) { }

    /**
     * GET /scheduling-engine/slots?institutionId=&serviceId=&date=YYYY-MM-DD&branchId=
     * Returns available time slots (HH:MM) for the given institution/branch/service/date
     */
    @Get('getAvailableSlots')
    @ApiOperation({ summary: 'Obtener horarios disponibles para reservar' })
    @ApiQuery({ name: 'institutionId', required: true })
    @ApiQuery({ name: 'serviceId', required: true })
    @ApiQuery({ name: 'date', required: true })
    @ApiQuery({ name: 'branchId', required: false })
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

    @Get('debug')
    @ApiOperation({ summary: 'Debug: trace why slots are empty' })
    debugSlots(
        @Query('institutionId') institutionId: string,
        @Query('serviceId') serviceId: string,
        @Query('date') date: string,
        @Query('branchId') branchId?: string,
    ) {
        return this.schedulingEngineService.debugSlots({
            institutionId,
            branchId: branchId || undefined,
            serviceId,
            date,
        });
    }
}
