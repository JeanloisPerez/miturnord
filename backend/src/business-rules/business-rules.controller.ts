import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BusinessRulesService } from './business-rules.service';
import { UpsertBusinessRuleDto } from './dto/upsert-business-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('business-rules')
export class BusinessRulesController {
    constructor(private readonly businessRulesService: BusinessRulesService) { }

    @Get(':institutionId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    findOne(@Param('institutionId') institutionId: string) {
        return this.businessRulesService.findOrCreate(institutionId);
    }

    @Put(':institutionId')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    upsert(
        @Param('institutionId') institutionId: string,
        @Body() dto: UpsertBusinessRuleDto,
        @Request() req,
    ) {
        return this.businessRulesService.upsert(institutionId, dto, req.user.sub, req.user.role);
    }
}
