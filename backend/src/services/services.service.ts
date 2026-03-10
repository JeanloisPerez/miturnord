import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateServiceDto {
    name: string;
    description?: string;
    duration: number;   // minutes
    price?: number;
    institution_id: string;
}

export class UpdateServiceDto {
    name?: string;
    description?: string;
    duration?: number;
    price?: number;
    active?: boolean;
}

@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    /** Public — list active services for a given institution */
    findByInstitution(institution_id: string) {
        return this.prisma.service.findMany({
            where: { institution_id, active: true },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const service = await this.prisma.service.findUnique({ where: { id } });
        if (!service) throw new NotFoundException(`Servicio ${id} no encontrado`);
        return service;
    }

    async create(dto: CreateServiceDto, userId: string) {
        // Ensure requesting user is the OWNER of this institution
        const membership = await this.prisma.institutionUser.findFirst({
            where: { institution_id: dto.institution_id, user_id: userId, role: 'OWNER' },
        });
        if (!membership) throw new ForbiddenException('No puedes agregar servicios a esta institución');

        return this.prisma.service.create({
            data: {
                name: dto.name,
                description: dto.description,
                duration: dto.duration,
                price: dto.price,
                institution_id: dto.institution_id,
            },
        });
    }

    async update(id: string, dto: UpdateServiceDto, userId: string, userRole: string) {
        const service = await this.findOne(id);
        if (userRole === 'INSTITUTION_OWNER') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: service.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('No tienes permiso para editar este servicio');
        }
        return this.prisma.service.update({ where: { id }, data: dto });
    }

    async remove(id: string, userId: string, userRole: string) {
        const service = await this.findOne(id);
        if (userRole === 'INSTITUTION_OWNER') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: service.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('No tienes permiso para eliminar este servicio');
        }
        return this.prisma.service.update({ where: { id }, data: { active: false } });
    }
}
