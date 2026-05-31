import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_INSTITUTION_TYPES } from '../constants/institution-types';

const INSTITUTION_INCLUDE = {
  institution_type: true,
  services: { where: { active: true }, orderBy: { name: 'asc' as const } },
  schedules: { where: { active: true }, orderBy: { day_of_week: 'asc' as const } },
  custom_fields: { orderBy: { order: 'asc' as const } },
  reviews: { include: { user: { select: { full_name: true } } }, orderBy: { created_at: 'desc' as const } }
};

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateInstitutionDto) {
    const institution = await this.prisma.institution.create({
      data: dto,
      include: INSTITUTION_INCLUDE,
    });

    if (institution.institution_type) {
      const defaultType = DEFAULT_INSTITUTION_TYPES.find(t => t.name === institution.institution_type.name);
      if (defaultType && defaultType.fields) {
        await this.prisma.customField.createMany({
          data: defaultType.fields.map(f => ({
            ...f,
            field_type: f.field_type as any,
            institution_id: institution.id
          }))
        });
      }
    }

    return this.prisma.institution.findUnique({
      where: { id: institution.id },
      include: INSTITUTION_INCLUDE
    });
  }

  async findAll(search?: string, institutionTypeId?: string) {
    let matchingInstitutionIds: string[] = [];

    if (search) {
      // First, find all institutions that have a service matching the search
      const matchingServices = await this.prisma.service.findMany({
        where: {
          name: { contains: search, mode: 'insensitive' as const },
          active: true
        },
        select: { institution_id: true }
      });
      matchingInstitutionIds = matchingServices.map(s => s.institution_id);
    }

    return this.prisma.institution.findMany({
      where: {
        status: 'active',
        is_public: true,          // Solo instituciones que eligieron ser públicas
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            ...(matchingInstitutionIds.length > 0 ? [{ id: { in: matchingInstitutionIds } }] : [])
          ]
        } : {}),
        ...(institutionTypeId ? { institution_type_id: institutionTypeId } : {}),
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

  adminFindAll(search?: string) {
    return this.prisma.institution.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      include: {
        institution_type: { select: { id: true, name: true, icon: true } },
        _count: { select: { appointments: true, branches: true, services: true, users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async adminStats() {
    const [institutions, users, appointments] = await Promise.all([
      this.prisma.institution.count(),
      this.prisma.user.count(),
      this.prisma.appointment.count(),
    ]);
    const activeInstitutions = await this.prisma.institution.count({ where: { status: 'active' } });
    return { institutions, activeInstitutions, users, appointments };
  }
}
