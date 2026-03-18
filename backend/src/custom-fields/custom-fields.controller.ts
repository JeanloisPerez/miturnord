import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('custom-fields')
export class CustomFieldsController {
    constructor(private readonly customFieldsService: CustomFieldsService) { }

    // Owner creating a field
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
    @Post()
    create(@Body() dto: CreateCustomFieldDto, @Request() req) {
        return this.customFieldsService.create(req.user.institutionId, dto);
    }

    // Public/Client getting fields for an institution to book
    @Get('institution/:institutionId')
    findAllPublic(
        @Param('institutionId') institutionId: string,
        @Query('serviceId') serviceId?: string
    ) {
        return this.customFieldsService.findAllByInstitution(institutionId, serviceId);
    }

    // Owner updating a field
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateCustomFieldDto,
        @Request() req
    ) {
        return this.customFieldsService.update(id, req.user.institutionId, dto);
    }

    // Owner deleting a field
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.customFieldsService.remove(id, req.user.institutionId);
    }
}
