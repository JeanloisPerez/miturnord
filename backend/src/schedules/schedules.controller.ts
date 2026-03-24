import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService, CreateScheduleDto, UpdateScheduleDto } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Horarios - Schedules')
@Controller('schedules')
export class SchedulesController {
    constructor(private readonly schedulesService: SchedulesService) { }

    /** Public — clients check an institution's availability */
    @Get('scheduleListByInstitution/:id')
    @ApiOperation({ summary: 'Obtener horarios de una institución (Público)' })
    @ApiResponse({ status: 200, description: 'Horarios devueltos correctamente.' })
    findByInstitution(@Param('id') id: string) {
        return this.schedulesService.findByInstitution(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('createSchedule')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Crear horario para una institución (Solo Dueños o Admin)' })
    @ApiResponse({ status: 201, description: 'Horario creado.' })
    create(@Body() dto: CreateScheduleDto, @Request() req) {
        return this.schedulesService.create(dto, req.user.sub);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch('updateSchedule/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Actualizar un horario' })
    @ApiResponse({ status: 200, description: 'Horario actualizado.' })
    update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @Request() req) {
        return this.schedulesService.update(id, dto, req.user.sub, req.user.role);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete('deleteSchedule/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Eliminar un horario' })
    @ApiResponse({ status: 200, description: 'Horario eliminado.' })
    remove(@Param('id') id: string, @Request() req) {
        return this.schedulesService.remove(id, req.user.sub, req.user.role);
    }
}
