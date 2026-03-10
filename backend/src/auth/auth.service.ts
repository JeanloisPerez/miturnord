import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';


@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async register(dto: RegisterDto) {
        if (!dto.email && !dto.phone) {
            throw new BadRequestException('Correo telefono es requerido para el registro');
        }

        if (dto.role === 'INSTITUTION_OWNER' && (!dto.institution_name || !dto.institution_type_id)) {
            throw new BadRequestException(
                'El nombre y tipo de institución son requeridos para propietarios',
            );
        }

        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    dto.email ? { email: dto.email } : undefined,
                    dto.phone ? { phone: dto.phone } : undefined,
                ].filter(Boolean) as any,
            },
        });

        if (existingUser) {
            throw new BadRequestException('Usuario ya existe');
        }

        const selectedRole = await this.prisma.role.findUnique({
            where: { name: dto.role },
        });

        if (!selectedRole) {
            throw new BadRequestException('Rol inválido seleccionado');
        }



        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const result = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    full_name: dto.full_name,
                    email: dto.email,
                    phone: dto.phone,
                    password_hash: hashedPassword,
                },
            });

            await tx.userRole.create({
                data: {
                    user_id: newUser.id,
                    role_id: selectedRole.id,
                },
            });

            if (selectedRole.name === 'INSTITUTION_OWNER') {

                const slug = dto.institution_name!
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-') + '-' + Date.now();

                const institution = await tx.institution.create({
                    data: {
                        name: dto.institution_name!,
                        institution_type_id: dto.institution_type_id!,
                        slug,
                        description: dto.institution_description,
                        address: dto.institution_address,
                        phone: dto.institution_phone,
                        email: dto.email,
                    },
                });

                await tx.institutionUser.create({
                    data: {
                        institution_id: institution.id,
                        user_id: newUser.id,
                        role: 'OWNER',
                    },
                });
            }

            return newUser;
        });

        const userWithRoles = await this.prisma.user.findUnique({
            where: { id: result.id },
            include: {
                roles: {
                    include: { role: true },
                },
                institution_memberships: true,
            },
        });

        return this.generateToken(userWithRoles);
    }
    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                roles: { include: { role: true } },
                institution_memberships: true,
            }
        });

        if (!user) throw new UnauthorizedException();

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) throw new UnauthorizedException();

        return this.generateToken(user);
    }

    private async generateToken(user: any) {
        const globalRoles = user.roles.map(r => r.role.name);

        const primaryRole = globalRoles[0] || 'CLIENT';

        const institutions = user.institution_memberships.map(m => ({
            institution_id: m.institution_id,
            role: m.role,
        }));

        const primaryInstitutionId = institutions.length > 0 ? institutions[0].institution_id : null;

        const payload = {
            sub: user.id,
            role: primaryRole,
            roles: globalRoles,
            institutionId: primaryInstitutionId,
            institutions,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}