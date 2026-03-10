import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { PrismaService } from '../prisma/prisma.service';

const INSTITUTION_INCLUDE = {
  institution_type: {
    include: { fields: { orderBy: { order: 'asc' as const } } },
  },
  services: { where: { active: true }, orderBy: { name: 'asc' as const } },
  schedules: { where: { active: true }, orderBy: { day_of_week: 'asc' as const } },
};

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) { }

  create(dto: CreateInstitutionDto) {
    return this.prisma.institution.create({
      data: dto,
      include: INSTITUTION_INCLUDE,
    });
  }

  findAll(search?: string) {
    return this.prisma.institution.findMany({
      where: {
        status: 'active',
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      include: {
        institution_type: { select: { id: true, name: true, icon: true } },
        services: { where: { active: true }, select: { id: true, name: true, duration: true, price: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: INSTITUTION_INCLUDE,
    });
    if (!institution) throw new NotFoundException(`Institución ${id} no encontrada`);
    return institution;
  }

  async findBySlug(slug: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { slug },
      include: INSTITUTION_INCLUDE,
    });
    if (!institution) throw new NotFoundException(`Institución "${slug}" no encontrada`);
    return institution;
  }

  async update(id: string, dto: UpdateInstitutionDto, requestUserId?: string, requestUserRole?: string) {
    const institution = await this.findOne(id);

    if (requestUserRole === 'INSTITUTION_OWNER') {
      const membership = await this.prisma.institutionUser.findFirst({
        where: { institution_id: id, user_id: requestUserId, role: 'OWNER' },
      });
      if (!membership) throw new ForbiddenException('No tienes permiso para editar esta institución');
    }

    return this.prisma.institution.update({
      where: { id },
      data: dto,
      include: INSTITUTION_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.institution.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
