import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

export class CreateServiceDto {
    @ApiProperty({ example: 'Consulta General', description: 'Nombre del servicio' })
    name: string;
    @ApiProperty({ example: 'Evaluación médica general', description: 'Descripción detallada', required: false })
    description?: string;
    @ApiProperty({ example: 30, description: 'Duración en minutos' })
    duration: number;   // minutes
    @ApiProperty({ example: 1500.00, description: 'Precio del servicio', required: false })
    price?: number;
    @ApiProperty({ example: 'uuid-institucion', description: 'ID de la institución' })
    institution_id: string;
}

export class UpdateServiceDto {
    @ApiProperty({ example: 'Consulta General (Actualizada)', description: 'Nombre del servicio', required: false })
    name?: string;
    @ApiProperty({ example: 'Evaluación médica especializada', description: 'Descripción detallada', required: false })
    description?: string;
    @ApiProperty({ example: 45, description: 'Duración en minutos', required: false })
    duration?: number;
    @ApiProperty({ example: 2000.00, description: 'Precio del servicio', required: false })
    price?: number;
    @ApiProperty({ example: false, description: 'Estado activo o inactivo', required: false })
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

    // ─── Branch assignment ──────────────────────────────────────────────

    /** List active services assigned to a specific branch */
    findByBranch(branchId: string) {
        return this.prisma.service.findMany({
            where: {
                active: true,
                branches: { some: { branch_id: branchId, active: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    /** Get all branch assignments for a given service */
    findBranchAssignments(serviceId: string) {
        return this.prisma.branchService.findMany({
            where: { service_id: serviceId },
            include: { branch: { select: { id: true, name: true, city: true, is_main: true } } },
        });
    }

    /** Assign a service to a branch (idempotent upsert) */
    async assignToBranch(serviceId: string, branchId: string, userId: string, userRole: string) {
        const service = await this.findOne(serviceId);

        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: service.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso para asignar servicios a esta sucursal');
        }

        // Confirm branch belongs to same institution
        const branch = await this.prisma.branch.findFirst({
            where: { id: branchId, institution_id: service.institution_id },
        });
        if (!branch) throw new NotFoundException('Sucursal no encontrada o no pertenece a esta institución');

        return this.prisma.branchService.upsert({
            where: { branch_id_service_id: { branch_id: branchId, service_id: serviceId } },
            create: { branch_id: branchId, service_id: serviceId, active: true },
            update: { active: true },
        });
    }

    /** Deactivate a service from a branch (soft-delete) */
    async removeFromBranch(serviceId: string, branchId: string, userId: string, userRole: string) {
        const service = await this.findOne(serviceId);

        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: service.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso para modificar asignaciones de esta institución');
        }

        const assignment = await this.prisma.branchService.findUnique({
            where: { branch_id_service_id: { branch_id: branchId, service_id: serviceId } },
        });
        if (!assignment) throw new NotFoundException('El servicio no está asignado a esta sucursal');

        return this.prisma.branchService.update({
            where: { branch_id_service_id: { branch_id: branchId, service_id: serviceId } },
            data: { active: false },
        });
    }
}
