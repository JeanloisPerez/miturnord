import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reportes - Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('institutionSummary/:institutionId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Obtener un resumen o reporte de una institución' })
    @ApiQuery({ name: 'range', required: false, enum: ['week', 'month'], description: 'Rango de tiempo predeterminado' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (Opcional, formato YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (Opcional, formato YYYY-MM-DD)' })
    @ApiQuery({ name: 'serviceId', required: false, description: 'Filtrar por ID de servicio' })
    @ApiQuery({ name: 'branchId', required: false, description: 'Filtrar por ID de sucursal' })
    @ApiResponse({ status: 200, description: 'Resumen obtenido exitosamente.' })
    getSummary(
        @Param('institutionId') institutionId: string,
        @Query('range') range: 'week' | 'month' = 'week',
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('serviceId') serviceId: string,
        @Query('branchId') branchId: string,
        @Request() req,
    ) {
        return this.reportsService.getSummary(institutionId, range, req.user.sub, req.user.role, startDate, endDate, serviceId, branchId);
    }
}
