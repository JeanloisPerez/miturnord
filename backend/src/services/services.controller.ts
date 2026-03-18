import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ServicesService, CreateServiceDto, UpdateServiceDto } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    /** Public — clients browse services of a given institution */
    @Get('institution/:id')
    findByInstitution(@Param('id') id: string) {
        return this.servicesService.findByInstitution(id);
    }

    /** Public — services available at a specific branch */
    @Get('branch/:branchId')
    findByBranch(@Param('branchId') branchId: string) {
        return this.servicesService.findByBranch(branchId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.servicesService.findOne(id);
    }

    /** Owner — view branch assignments for a service */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':id/branches')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    findBranchAssignments(@Param('id') id: string) {
        return this.servicesService.findBranchAssignments(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    create(@Body() dto: CreateServiceDto, @Request() req) {
        return this.servicesService.create(dto, req.user.sub);
    }

    /** Owner — assign a service to a branch */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post(':id/branches/:branchId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    assignToBranch(
        @Param('id') serviceId: string,
        @Param('branchId') branchId: string,
        @Request() req,
    ) {
        return this.servicesService.assignToBranch(serviceId, branchId, req.user.sub, req.user.role);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @Request() req) {
        return this.servicesService.update(id, dto, req.user.sub, req.user.role);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        return this.servicesService.remove(id, req.user.sub, req.user.role);
    }

    /** Owner — remove a service from a branch */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id/branches/:branchId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    removeFromBranch(
        @Param('id') serviceId: string,
        @Param('branchId') branchId: string,
        @Request() req,
    ) {
        return this.servicesService.removeFromBranch(serviceId, branchId, req.user.sub, req.user.role);
    }
}
