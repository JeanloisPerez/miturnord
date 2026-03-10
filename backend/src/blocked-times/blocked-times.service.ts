import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';

@Injectable()
export class BlockedTimesService {
    constructor(private prisma: PrismaService) { }

    findByBranch(branchId: string) {
        return this.prisma.blockedTime.findMany({
            where: { branch_id: branchId },
            orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
        });
    }

    async create(dto: CreateBlockedTimeDto, userId: string, userRole: string) {
        if (userRole !== 'SAAS_ADMIN') {
            const branch = await this.prisma.branch.findUnique({ where: { id: dto.branch_id } });
            if (!branch) throw new NotFoundException('Sucursal no encontrada');
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: branch.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso para bloquear horarios en esta sucursal');
        }
        return this.prisma.blockedTime.create({ data: { ...dto, date: new Date(dto.date) } });
    }

    async remove(id: string, userId: string, userRole: string) {
        const blocked = await this.prisma.blockedTime.findUnique({
            where: { id },
            include: { branch: true },
        });
        if (!blocked) throw new NotFoundException('Horario bloqueado no encontrado');
        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: blocked.branch.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso');
        }
        return this.prisma.blockedTime.delete({ where: { id } });
    }
}
