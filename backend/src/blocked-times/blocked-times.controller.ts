import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BlockedTimesService } from './blocked-times.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Horarios Bloqueados - Blocked Times')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blocked-times')
export class BlockedTimesController {
    constructor(private readonly blockedTimesService: BlockedTimesService) { }

    @Get('blockedTimeList')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Obtener horarios bloqueados de una sucursal' })
    @ApiQuery({ name: 'branchId', required: true, description: 'ID de la sucursal' })
    @ApiResponse({ status: 200, description: 'Lista de horarios obtenidos.' })
    findByBranch(@Query('branchId') branchId: string) {
        return this.blockedTimesService.findByBranch(branchId);
    }

    @Post('createBlockedTime')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Crear un nuevo bloqueo de horario para una sucursal' })
    @ApiResponse({ status: 201, description: 'Horario bloqueado exitosamente.' })
    create(@Body() dto: CreateBlockedTimeDto, @Request() req) {
        return this.blockedTimesService.create(dto, req.user.sub, req.user.role);
    }

    @Delete('deleteBlockedTime/:id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Eliminar un bloqueo de horario' })
    @ApiResponse({ status: 200, description: 'Bloqueo eliminado correctamente.' })
    remove(@Param('id') id: string, @Request() req) {
        return this.blockedTimesService.remove(id, req.user.sub, req.user.role);
    }
}
