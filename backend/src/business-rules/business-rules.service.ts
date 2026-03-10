import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBusinessRuleDto } from './dto/upsert-business-rule.dto';

@Injectable()
export class BusinessRulesService {
    constructor(private prisma: PrismaService) { }

    async findOrCreate(institutionId: string) {
        const existing = await this.prisma.businessRule.findUnique({
            where: { institution_id: institutionId },
        });
        if (existing) return existing;

        // Return defaults without persisting
        return {
            institution_id: institutionId,
            auto_confirm: true,
            buffer_minutes: 0,
            max_per_slot: 1,
            no_show_minutes: 30,
            advance_book_days: 30,
        };
    }

    async upsert(institutionId: string, dto: UpsertBusinessRuleDto, userId: string, userRole: string) {
        if (userRole !== 'SAAS_ADMIN') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: institutionId, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso para editar las reglas de esta institución');
        }

        return this.prisma.businessRule.upsert({
            where: { institution_id: institutionId },
            update: dto,
            create: { institution_id: institutionId, ...dto },
        });
    }
}
