import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

export class CreateScheduleDto {
    @ApiProperty({ example: 'uuid-institucion', description: 'ID de la institución' })
    institution_id: string;
    @ApiProperty({ example: 1, description: 'Día de la semana (0=Dom, ..., 6=Sab)' })
    day_of_week: number;   // 0=Sun … 6=Sat
    @ApiProperty({ example: '08:00', description: 'Hora de inicio (HH:MM)' })
    start_time: string;    // "HH:MM"
    @ApiProperty({ example: '17:00', description: 'Hora de fin (HH:MM)' })
    end_time: string;
}

export class UpdateScheduleDto {
    @ApiProperty({ example: '09:00', description: 'Hora de inicio (HH:MM)', required: false })
    start_time?: string;
    @ApiProperty({ example: '18:00', description: 'Hora de fin (HH:MM)', required: false })
    end_time?: string;
    @ApiProperty({ example: true, description: 'Indica si el horario está activo', required: false })
    active?: boolean;
}

@Injectable()
export class SchedulesService {
    constructor(private prisma: PrismaService) { }


    findByInstitution(institution_id: string) {
        return this.prisma.schedule.findMany({
            where: { institution_id, active: true },
            orderBy: { day_of_week: 'asc' },
        });
    }

    async create(dto: CreateScheduleDto, userId: string) {

        const membership = await this.prisma.institutionUser.findFirst({
            where: { institution_id: dto.institution_id, user_id: userId, role: 'OWNER' },
        });
        if (!membership) throw new ForbiddenException('No puedes configurar horarios de esta institución');


        const existing = await this.prisma.schedule.findFirst({
            where: {
                institution_id: dto.institution_id,
                branch_id: (dto as any).branch_id ?? null,
                day_of_week: dto.day_of_week,
            },
        });
        if (existing) throw new ConflictException('Ya existe un horario para ese día. Usa PATCH para actualizarlo.');

        return this.prisma.schedule.create({ data: dto });
    }

    async update(id: string, dto: UpdateScheduleDto, userId: string, userRole: string) {
        const schedule = await this.prisma.schedule.findUnique({ where: { id } });
        if (!schedule) throw new NotFoundException(`Horario ${id} no encontrado`);

        if (userRole === 'INSTITUTION_OWNER') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: schedule.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso para editar este horario');
        }
        return this.prisma.schedule.update({ where: { id }, data: dto });
    }

    async remove(id: string, userId: string, userRole: string) {
        const schedule = await this.prisma.schedule.findUnique({ where: { id } });
        if (!schedule) throw new NotFoundException(`Horario ${id} no encontrado`);
        if (userRole === 'INSTITUTION_OWNER') {
            const membership = await this.prisma.institutionUser.findFirst({
                where: { institution_id: schedule.institution_id, user_id: userId, role: 'OWNER' },
            });
            if (!membership) throw new ForbiddenException('Sin permiso');
        }
        return this.prisma.schedule.delete({ where: { id } });
    }
}
