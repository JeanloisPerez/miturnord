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

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.servicesService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    create(@Body() dto: CreateServiceDto, @Request() req) {
        return this.servicesService.create(dto, req.user.sub);
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
}
