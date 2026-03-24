import {
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
    IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo' })
    @IsString()
    full_name: string;

    @ApiProperty({ example: 'juan@example.com', description: 'Correo electrónico', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ example: '809-555-0000', description: 'Teléfono', required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ example: 'SecureP@ss!', description: 'Contraseña (mínimo 6 caracteres)' })
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'CLIENT', description: 'Rol de usuario', enum: ['CLIENT', 'INSTITUTION_OWNER', 'SAAS_ADMIN'] })
    @IsString()
    @IsIn(['CLIENT', 'INSTITUTION_OWNER', 'SAAS_ADMIN'])
    role: string;

    @ApiProperty({ example: 'Mi Clínica', description: 'Nombre de la institución (solo para dueños)', required: false })
    @IsOptional()
    @IsString()
    institution_name?: string;

    @ApiProperty({ example: 'uuid-tipo-institucion', description: 'ID del tipo de institución', required: false })
    @IsOptional()
    @IsString()
    institution_type_id?: string;

    @ApiProperty({ example: 'Clínica dental especializada', description: 'Descripción de la institución', required: false })
    @IsOptional()
    @IsString()
    institution_description?: string;

    @ApiProperty({ example: 'Calle 123, Ciudad', description: 'Dirección de la institución', required: false })
    @IsOptional()
    @IsString()
    institution_address?: string;

    @ApiProperty({ example: '809-555-1111', description: 'Teléfono de la institución', required: false })
    @IsOptional()
    @IsString()
    institution_phone?: string;
}
