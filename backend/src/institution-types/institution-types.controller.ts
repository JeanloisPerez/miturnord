import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { InstitutionTypesService } from './institution-types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsString, IsOptional } from 'class-validator';

export class CreateTypeDto {
    @ApiProperty({ example: 'Clínica Dental', description: 'Nombre del tipo de institución' })
    @IsString() name: string;

    @ApiProperty({ example: 'Especialistas en odontología', description: 'Descripción opcional', required: false })
    @IsOptional() @IsString() description?: string;

    @ApiProperty({ example: 'tooth-icon.png', description: 'Icono opcional', required: false })
    @IsOptional() @IsString() icon?: string;
}

@ApiTags('Tipos de Institución - Institution Types')
@Controller('institution-types')
export class InstitutionTypesController {
    constructor(private readonly service: InstitutionTypesService) { }

    /** Public — needed when registering an institution */
    @Get('typeList')
    @ApiOperation({ summary: 'Obtener todos los tipos de instituciones (Público)' })
    @ApiResponse({ status: 200, description: 'Lista de tipos obtenida.' })
    findAll() { return this.service.findAll(); }

    /** Public — returns type + all dynamic fields for that type */
    @Get('typeDetail/:id')
    @ApiOperation({ summary: 'Obtener un tipo de institución específico con sus campos dinámicos (Público)' })
    @ApiResponse({ status: 200, description: 'Tipo obtenido.' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('createType')
    @Roles('SAAS_ADMIN')
    @ApiOperation({ summary: 'Crear un nuevo tipo de institución (Solo SAAS_ADMIN)' })
    @ApiResponse({ status: 201, description: 'Tipo creado exitosamente.' })
    create(@Body() dto: CreateTypeDto) { return this.service.create(dto); }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch('updateType/:id')
    @Roles('SAAS_ADMIN')
    @ApiOperation({ summary: 'Actualizar un tipo de institución (Solo SAAS_ADMIN)' })
    @ApiResponse({ status: 200, description: 'Tipo actualizado.' })
    update(@Param('id') id: string, @Body() dto: Partial<CreateTypeDto>) {
        return this.service.update(id, dto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete('deleteType/:id')
    @Roles('SAAS_ADMIN')
    @ApiOperation({ summary: 'Eliminar un tipo de institución (Solo SAAS_ADMIN)' })
    @ApiResponse({ status: 200, description: 'Tipo eliminado correctamente.' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
