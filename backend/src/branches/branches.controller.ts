import {
    Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Get('institution/:institutionId')
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
    findByInstitution(@Param('institutionId') institutionId: string) {
        return this.branchesService.findByInstitution(institutionId);
    }

    @Get(':id')
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER', 'CLIENT')
    findOne(@Param('id') id: string) {
        return this.branchesService.findOne(id);
    }

    @Post()
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    create(@Body() dto: CreateBranchDto, @Request() req) {
        return this.branchesService.create(dto, req.user.sub, req.user.role);
    }

    @Patch(':id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateBranchDto, @Request() req) {
        return this.branchesService.update(id, dto, req.user.sub, req.user.role);
    }

    @Delete(':id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        return this.branchesService.remove(id, req.user.sub, req.user.role);
    }
}
