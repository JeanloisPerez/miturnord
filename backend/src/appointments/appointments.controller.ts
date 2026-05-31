import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Citas - Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post('createAppointment')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Crear una nueva cita (Solo Clientes)' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente.' })
  @ApiResponse({ status: 409, description: 'Horario no disponible.' })
  create(@Body() dto: CreateAppointmentDto, @Request() req) {
    return this.appointmentsService.create({ ...dto, booked_by_staff: false }, req.user.sub);
  }

  @Post('staff')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'STAFF')
  @ApiOperation({ summary: 'Crear una cita internamente por el staff (incluye walk-ins)' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente por el staff.' })
  @ApiResponse({ status: 409, description: 'Horario no disponible.' })
  createByStaff(@Body() dto: CreateAppointmentDto, @Request() req) {
    // Forzamos el flag para que el service sepa que es una reserva interna
    return this.appointmentsService.create({ ...dto, booked_by_staff: true }, req.user.sub);
  }

  @Get('appointmentList')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
  @ApiOperation({ summary: 'Obtener lista de citas del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Citas devueltas correctamente.' })
  findAll(@Request() req) {
    return this.appointmentsService.findAll(
      req.user.sub,
      req.user.role,
      req.user.institutionId,
    );
  }

  @Get('appointmentListByInstitution/:institutionId')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  @ApiOperation({ summary: 'Obtener citas de una institución específica con filtros opcionales' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado de la cita (Ej. PENDING, CONFIRMED)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filtrar por ID de la sucursal' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por fecha específica (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Citas de la institución devueltas.' })
  findByInstitution(
    @Param('institutionId') institutionId: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAllByInstitution(institutionId, { status, branchId, date });
  }

  @Get('institutionClients/:institutionId')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  @ApiOperation({ summary: 'Obtener lista de clientes de una institución' })
  @ApiResponse({ status: 200, description: 'Clientes devueltos.' })
  getClients(@Param('institutionId') institutionId: string, @Request() req) {
    return this.appointmentsService.getInstitutionClients(
      institutionId,
      req.user.sub,
      req.user.role,
    );
  }

  @Get('appointmentDetail/:id')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
  @ApiOperation({ summary: 'Obtener detalles de una cita específica' })
  @ApiResponse({ status: 200, description: 'Cita encontrada.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.findOne(
      id,
      req.user.sub,
      req.user.role,
      req.user.institutionId,
    );
  }

  @Patch('updateAppointment/:id')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  @ApiOperation({ summary: 'Actualizar una cita (Modificar estado, notas)' })
  @ApiResponse({ status: 200, description: 'Cita actualizada.' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @Request() req) {
    return this.appointmentsService.update(
      id,
      dto,
      req.user.sub,
      req.user.role,
      req.user.institutionId,
    );
  }

  @Patch('reschedule/:id')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
  @ApiOperation({ summary: 'Reagendar una cita (Cliente o Dueño)' })
  @ApiResponse({ status: 200, description: 'Cita reagendada exitosamente.' })
  @ApiResponse({ status: 409, description: 'Nuevo horario no disponible.' })
  reschedule(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @Request() req) {
    return this.appointmentsService.update(
      id,
      dto,
      req.user.sub,
      req.user.role,
      req.user.institutionId,
    );
  }

  @Patch('cancelAppointment/:id')
  @Roles('CLIENT', 'INSTITUTION_OWNER', 'SAAS_ADMIN')
  @ApiOperation({ summary: 'Cancelar una cita (Cliente o Institución)' })
  @ApiResponse({ status: 200, description: 'Cita cancelada correctamente.' })
  cancel(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.cancel(id, req.user.sub, req.user.role, req.user.institutionId);
  }

  @Delete('deleteAppointment/:id')
  @Roles('SAAS_ADMIN')
  @ApiOperation({ summary: 'Eliminar una cita permanentemente (Solo SAAS_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Cita eliminada.' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Post(':id/review')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Agregar valoración y reseña a una cita completada' })
  @ApiResponse({ status: 201, description: 'Reseña agregada exitosamente.' })
  createReview(
    @Param('id') id: string,
    @Body() dto: { rating: number; comment?: string },
    @Request() req,
  ) {
    return this.appointmentsService.createReview(id, dto.rating, dto.comment, req.user.sub);
  }
}
