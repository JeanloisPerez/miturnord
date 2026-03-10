import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @Roles('CLIENT')
  create(@Body() dto: CreateAppointmentDto, @Request() req) {
    return this.appointmentsService.create(dto, req.user.sub);
  }

  @Get()
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
  findAll(@Request() req) {
    return this.appointmentsService.findAll(
      req.user.sub,
      req.user.role,
      req.user.institutionId,
    );
  }

  @Get('institution/:institutionId')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  findByInstitution(
    @Param('institutionId') institutionId: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAllByInstitution(institutionId, { status, branchId, date });
  }

  @Get('clients/:institutionId')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  getClients(@Param('institutionId') institutionId: string, @Request() req) {
    return this.appointmentsService.getInstitutionClients(
      institutionId,
      req.user.sub,
      req.user.role,
    );
  }

  @Get(':id')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
  findOne(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.findOne(
      id,
      req.user.sub,
      req.user.role,
      req.user.institutionId,
    );
  }

  @Patch(':id')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @Request() req) {
    return this.appointmentsService.update(
      id,
      dto,
      req.user.sub,
      req.user.role,
      req.user.institutionId,
    );
  }

  @Patch(':id/cancel')
  @Roles('CLIENT')
  cancel(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.cancel(id, req.user.sub);
  }

  @Delete(':id')
  @Roles('SAAS_ADMIN')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
