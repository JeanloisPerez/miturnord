import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BlockedTimesService } from './blocked-times.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blocked-times')
export class BlockedTimesController {
    constructor(private readonly blockedTimesService: BlockedTimesService) { }

    @Get()
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    findByBranch(@Query('branchId') branchId: string) {
        return this.blockedTimesService.findByBranch(branchId);
    }

    @Post()
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    create(@Body() dto: CreateBlockedTimeDto, @Request() req) {
        return this.blockedTimesService.create(dto, req.user.sub, req.user.role);
    }

    @Delete(':id')
    @Roles('INSTITUTION_OWNER', 'SAAS_ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        return this.blockedTimesService.remove(id, req.user.sub, req.user.role);
    }
}
