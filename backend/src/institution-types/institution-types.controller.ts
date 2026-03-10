import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { InstitutionTypesService } from './institution-types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsString, IsOptional } from 'class-validator';

class CreateTypeDto {
    @IsString() name: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsString() icon?: string;
}

@Controller('institution-types')
export class InstitutionTypesController {
    constructor(private readonly service: InstitutionTypesService) { }

    /** Public — needed when registering an institution */
    @Get()
    findAll() { return this.service.findAll(); }

    /** Public — returns type + all dynamic fields for that type */
    @Get(':id')
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles('SAAS_ADMIN')
    create(@Body() dto: CreateTypeDto) { return this.service.create(dto); }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    @Roles('SAAS_ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateTypeDto>) {
        return this.service.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @Roles('SAAS_ADMIN')
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
