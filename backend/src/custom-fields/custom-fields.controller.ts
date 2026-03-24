import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Campos Personalizados - Custom Fields')
@Controller('custom-fields')
export class CustomFieldsController {
    constructor(private readonly customFieldsService: CustomFieldsService) { }

    // Owner creating a field
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
    @Post('createCustomField')
    @ApiOperation({ summary: 'Crear un nuevo campo personalizado (Solo Dueños o Admin)' })
    @ApiResponse({ status: 201, description: 'Campo personalizado creado exitosamente.' })
    create(@Body() dto: CreateCustomFieldDto, @Request() req) {
        return this.customFieldsService.create(req.user.institutionId, dto);
    }

    // Public/Client getting fields for an institution to book
    @Get('customFieldListByInstitution/:institutionId')
    @ApiOperation({ summary: 'Obtener campos personalizados activos de una institución (Público)' })
    @ApiQuery({ name: 'serviceId', required: false, description: 'ID del servicio (para filtrar campos específicos de un servicio)' })
    @ApiResponse({ status: 200, description: 'Campos personalizados devueltos.' })
    findAllPublic(
        @Param('institutionId') institutionId: string,
        @Query('serviceId') serviceId?: string
    ) {
        return this.customFieldsService.findAllByInstitution(institutionId, serviceId);
    }

    // Owner updating a field
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
    @Patch('updateCustomField/:id')
    @ApiOperation({ summary: 'Actualizar un campo personalizado' })
    @ApiResponse({ status: 200, description: 'Campo actualizado correctamente.' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateCustomFieldDto,
        @Request() req
    ) {
        return this.customFieldsService.update(id, req.user.institutionId, dto);
    }

    // Owner deleting a field
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
    @Delete('deleteCustomField/:id')
    @ApiOperation({ summary: 'Eliminar un campo personalizado (Soft-delete)' })
    @ApiResponse({ status: 200, description: 'Campo eliminado.' })
    remove(@Param('id') id: string, @Request() req) {
        return this.customFieldsService.remove(id, req.user.institutionId);
    }
}
