import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('institution/:institutionId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    getSummary(
        @Param('institutionId') institutionId: string,
        @Query('range') range: 'week' | 'month' = 'week',
        @Request() req,
    ) {
        return this.reportsService.getSummary(institutionId, range, req.user.sub, req.user.role);
    }
}
