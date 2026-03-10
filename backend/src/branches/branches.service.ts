import {
    Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
    constructor(private prisma: PrismaService) { }

    findByInstitution(institutionId: string) {
        return this.prisma.branch.findMany({
            where: { institution_id: institutionId },
            orderBy: [{ is_main: 'desc' }, { name: 'asc' }],
        });
    }

    async findOne(id: string) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch) throw new NotFoundException(`Sucursal ${id} no encontrada`);
        return branch;
    }

    async create(dto: CreateBranchDto, userId: string, userRole: string) {
        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: dto.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('No tienes permiso para crear sucursales en esta institución');
        }
        return this.prisma.branch.create({ data: dto });
    }

    async update(id: string, dto: UpdateBranchDto, userId: string, userRole: string) {
        const branch = await this.findOne(id);
        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: branch.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso para editar esta sucursal');
        }
        return this.prisma.branch.update({ where: { id }, data: dto });
    }

    async remove(id: string, userId: string, userRole: string) {
        const branch = await this.findOne(id);
        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: branch.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso para eliminar esta sucursal');
        }
        return this.prisma.branch.update({ where: { id }, data: { active: false } });
    }
}
