import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService, CreateServiceDto, UpdateServiceDto } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Servicios - Services')
@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    /** Public — clients browse services of a given institution */
    @Get('serviceListByInstitution/:id')
    @ApiOperation({ summary: 'Obtener servicios públicos de una institución (Público)' })
    @ApiResponse({ status: 200, description: 'Lista de servicios devuelta.' })
    findByInstitution(@Param('id') id: string) {
        return this.servicesService.findByInstitution(id);
    }

    /** Public — services available at a specific branch */
    @Get('serviceListByBranch/:branchId')
    @ApiOperation({ summary: 'Obtener servicios asignados a una sucursal específica (Público)' })
    @ApiResponse({ status: 200, description: 'Lista de servicios devuelta.' })
    findByBranch(@Param('branchId') branchId: string) {
        return this.servicesService.findByBranch(branchId);
    }

    @Get('serviceDetail/:id')
    @ApiOperation({ summary: 'Obtener información de un servicio específico' })
    @ApiResponse({ status: 200, description: 'Servicio encontrado.' })
    @ApiResponse({ status: 404, description: 'Servicio no encontrado.' })
    findOne(@Param('id') id: string) {
        return this.servicesService.findOne(id);
    }

    /** Owner — view branch assignments for a service */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('branchAssignments/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Ver sucursales asignadas a este servicio (Solo Dueños o Admin)' })
    @ApiResponse({ status: 200, description: 'Asignaciones devueltas correctamente.' })
    findBranchAssignments(@Param('id') id: string) {
        return this.servicesService.findBranchAssignments(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('createService')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Crear un nuevo servicio (Solo Dueños o Admin)' })
    @ApiResponse({ status: 201, description: 'Servicio creado exitosamente.' })
    create(@Body() dto: CreateServiceDto, @Request() req) {
        return this.servicesService.create(dto, req.user.sub);
    }

    /** Owner — assign a service to a branch */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('assignToBranch/:id/:branchId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Asignar un servicio a una sucursal (Solo Dueños o Admin)' })
    @ApiResponse({ status: 201, description: 'Servicio asignado a la sucursal.' })
    assignToBranch(
        @Param('id') serviceId: string,
        @Param('branchId') branchId: string,
        @Request() req,
    ) {
        return this.servicesService.assignToBranch(serviceId, branchId, req.user.sub, req.user.role);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch('updateService/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Actualizar la información de un servicio' })
    @ApiResponse({ status: 200, description: 'Servicio actualizado.' })
    update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @Request() req) {
        return this.servicesService.update(id, dto, req.user.sub, req.user.role);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete('deleteService/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Eliminar un servicio (Soft-delete)' })
    @ApiResponse({ status: 200, description: 'Servicio eliminado correctamente.' })
    remove(@Param('id') id: string, @Request() req) {
        return this.servicesService.remove(id, req.user.sub, req.user.role);
    }

    /** Owner — remove a service from a branch */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete('removeFromBranch/:id/:branchId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Remover un servicio de una sucursal' })
    @ApiResponse({ status: 200, description: 'Servicio desasignado de la sucursal.' })
    removeFromBranch(
        @Param('id') serviceId: string,
        @Param('branchId') branchId: string,
        @Request() req,
    ) {
        return this.servicesService.removeFromBranch(serviceId, branchId, req.user.sub, req.user.role);
    }
}
