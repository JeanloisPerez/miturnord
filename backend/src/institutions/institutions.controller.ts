import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Instituciones - Institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) { }

  @Get('institutionList')
  @ApiOperation({ summary: 'Obtener lista de instituciones (Búsqueda y filtrado)' })
  @ApiResponse({ status: 200, description: 'Lista de instituciones obtenida exitosamente.' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'institutionTypeId', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('institutionTypeId') institutionTypeId?: string,
  ) {
    return this.institutionsService.findAll(search, institutionTypeId);
  }

  @Get('institutionDetail/:id')
  @ApiOperation({ summary: 'Obtener detalles de una institución por ID' })
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Get('institutionDetailBySlug/:slug')
  @ApiOperation({ summary: 'Obtener detalles de una institución por su Slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.institutionsService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('createInstitution')
  @Roles('SAAS_ADMIN')
  @ApiOperation({ summary: 'Crear una nueva institución (Solo SAAS_ADMIN)' })
  @ApiResponse({ status: 201, description: 'Institución creada.' })
  create(@Body() dto: CreateInstitutionDto) {
    return this.institutionsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('updateInstitution/:id')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  @ApiOperation({ summary: 'Actualizar institución (SAAS_ADMIN o Dueño de Institución)' })
  update(@Param('id') id: string, @Body() dto: UpdateInstitutionDto, @Request() req) {
    return this.institutionsService.update(id, dto, req.user.sub, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('deleteInstitution/:id')
  @Roles('SAAS_ADMIN')
  @ApiOperation({ summary: 'Eliminar una institución (Solo SAAS_ADMIN)' })
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('adminList')
  @Roles('SAAS_ADMIN')
  @ApiOperation({ summary: 'SAAS_ADMIN: Lista completa de instituciones (activas e inactivas)' })
  adminList(@Query('search') search?: string) {
    return this.institutionsService.adminFindAll(search);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('adminStats')
  @Roles('SAAS_ADMIN')
  @ApiOperation({ summary: 'SAAS_ADMIN: Estadísticas globales de la plataforma' })
  adminStats() {
    return this.institutionsService.adminStats();
  }
}
