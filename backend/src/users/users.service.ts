import {
    Injectable, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                created_at: true,
                roles: { include: { role: true } },
            },
        });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async updateProfile(id: string, dto: { full_name?: string; phone?: string }) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.full_name ? { full_name: dto.full_name } : {}),
                ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
            },
            select: { id: true, full_name: true, email: true, phone: true },
        });
    }

    async changePassword(id: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta');

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password_hash: hashed },
        });
        return { message: 'Contraseña actualizada correctamente' };
    }
}
