import {
    Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Sucursales - Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Get('branchListByInstitution/:institutionId')
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
    @ApiOperation({ summary: 'Obtener sucursales por ID de institución' })
    @ApiResponse({ status: 200, description: 'Lista de sucursales devuelta.' })
    findByInstitution(@Param('institutionId') institutionId: string) {
        return this.branchesService.findByInstitution(institutionId);
    }

    @Get('branchDetail/:id')
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
    @ApiOperation({ summary: 'Obtener detalles de una sucursal específica' })
    @ApiResponse({ status: 200, description: 'Detalles de la sucursal devueltos.' })
    @ApiResponse({ status: 404, description: 'Sucursal no encontrada.' })
    findOne(@Param('id') id: string) {
        return this.branchesService.findOne(id);
    }

    @Post('createBranch')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Crear una nueva sucursal (Solo Dueños o SAAS_ADMIN)' })
    @ApiResponse({ status: 201, description: 'Sucursal creada.' })
    create(@Body() dto: CreateBranchDto, @Request() req) {
        return this.branchesService.create(dto, req.user.sub, req.user.role);
    }

    @Patch('updateBranch/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Actualizar una sucursal existente' })
    @ApiResponse({ status: 200, description: 'Sucursal actualizada correctamente.' })
    update(@Param('id') id: string, @Body() dto: UpdateBranchDto, @Request() req) {
        return this.branchesService.update(id, dto, req.user.sub, req.user.role);
    }

    @Delete('deleteBranch/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Eliminar una sucursal' })
    @ApiResponse({ status: 200, description: 'Sucursal eliminada correctamente.' })
    remove(@Param('id') id: string, @Request() req) {
        return this.branchesService.remove(id, req.user.sub, req.user.role);
    }
}
