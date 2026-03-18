import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) { }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('institutionTypeId') institutionTypeId?: string,
  ) {
    return this.institutionsService.findAll(search, institutionTypeId);
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }


  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.institutionsService.findBySlug(slug);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('SAAS_ADMIN')
  create(@Body() dto: CreateInstitutionDto) {
    return this.institutionsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('SAAS_ADMIN', 'INSTITUTION_OWNER')
  update(@Param('id') id: string, @Body() dto: UpdateInstitutionDto, @Request() req) {
    return this.institutionsService.update(id, dto, req.user.sub, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles('SAAS_ADMIN')
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(id);
  }
}
