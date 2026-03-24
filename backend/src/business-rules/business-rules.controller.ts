import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessRulesService } from './business-rules.service';
import { UpsertBusinessRuleDto } from './dto/upsert-business-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reglas de Negocio - Business Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('business-rules')
export class BusinessRulesController {
    constructor(private readonly businessRulesService: BusinessRulesService) { }

    @Get('businessRuleDetail/:institutionId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Obtener o inicializar reglas de negocio de una institución' })
    @ApiResponse({ status: 200, description: 'Reglas de negocio devueltas.' })
    findOne(@Param('institutionId') institutionId: string) {
        return this.businessRulesService.findOrCreate(institutionId);
    }

    @Put('updateBusinessRule/:institutionId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    @ApiOperation({ summary: 'Actualizar las reglas de negocio de una institución' })
    @ApiResponse({ status: 200, description: 'Reglas de negocio actualizadas correctamente.' })
    upsert(
        @Param('institutionId') institutionId: string,
        @Body() dto: UpsertBusinessRuleDto,
        @Request() req,
    ) {
        return this.businessRulesService.upsert(institutionId, dto, req.user.sub, req.user.role);
    }
}
