import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SchedulesService, CreateScheduleDto, UpdateScheduleDto } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedules')
export class SchedulesController {
    constructor(private readonly schedulesService: SchedulesService) { }

    /** Public — clients check an institution's availability */
    @Get('institution/:id')
    findByInstitution(@Param('id') id: string) {
        return this.schedulesService.findByInstitution(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    create(@Body() dto: CreateScheduleDto, @Request() req) {
        return this.schedulesService.create(dto, req.user.sub);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @Request() req) {
        return this.schedulesService.update(id, dto, req.user.sub, req.user.role);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        return this.schedulesService.remove(id, req.user.sub, req.user.role);
    }
}
