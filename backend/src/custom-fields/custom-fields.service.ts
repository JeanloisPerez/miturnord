import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';

@Injectable()
export class CustomFieldsService {
    constructor(private prisma: PrismaService) { }

    async create(institutionId: string, dto: CreateCustomFieldDto) {
        if (dto.service_id) {
            const service = await this.prisma.service.findFirst({
                where: { id: dto.service_id, institution_id: institutionId }
            });
            if (!service) throw new ForbiddenException('El servicio no pertenece a tu institución.');
        }

        return this.prisma.customField.create({
            data: {
                ...dto,
                institution_id: institutionId
            }
        });
    }

    async findAllByInstitution(institutionId: string, serviceId?: string) {
        const fields = await this.prisma.customField.findMany({
            where: { institution_id: institutionId },
            orderBy: { order: 'asc' }
        });

        if (serviceId) {
            // Return fields that match either no specific service (global) or the specific service
            return fields.filter(f => !f.service_id || f.service_id === serviceId);
        }

        return fields;
    }

    async findOne(id: string, institutionId: string) {
        const field = await this.prisma.customField.findUnique({
            where: { id }
        });

        if (!field) throw new NotFoundException('Campo dinámico no encontrado');
        if (field.institution_id !== institutionId) throw new ForbiddenException('No autorizado');

        return field;
    }

    async update(id: string, institutionId: string, dto: UpdateCustomFieldDto) {
        await this.findOne(id, institutionId); // Validation

        if (dto.service_id) {
            const service = await this.prisma.service.findFirst({
                where: { id: dto.service_id, institution_id: institutionId }
            });
            if (!service) throw new ForbiddenException('El servicio no pertenece a tu institución.');
        }

        return this.prisma.customField.update({
            where: { id },
            data: dto
        });
    }

    async remove(id: string, institutionId: string) {
        await this.findOne(id, institutionId); // Validation

        // Remove any historical responses that would prevent deletion (Foreign key constraint P2003)
        await this.prisma.appointmentFieldResponse.deleteMany({
            where: { field_id: id }
        });

        return this.prisma.customField.delete({
            where: { id }
        });
    }
}
