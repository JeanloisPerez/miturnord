import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstitutionTypesService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.institutionType.findMany({
            include: {
                _count: { select: { institutions: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const type = await this.prisma.institutionType.findUnique({
            where: { id },
        });
        if (!type) throw new NotFoundException(`Tipo de institución ${id} no encontrado`);
        return type;
    }

    create(data: { name: string; description?: string; icon?: string }) {
        return this.prisma.institutionType.create({ data });
    }

    update(id: string, data: { name?: string; description?: string; icon?: string }) {
        return this.prisma.institutionType.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.institutionType.delete({ where: { id } });
    }
}
