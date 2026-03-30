import { IsString, MinLength, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstitutionDto {
    @ApiProperty({ example: 'Mi Clínica Preferida', description: 'Nombre de la institución' })
    @IsString()
    @MinLength(3)
    name: string;

    @ApiProperty({ example: 'uuid-tipo-institucion', description: 'ID del tipo de institución asociada' })
    @IsString()
    institution_type_id: string;

    @ApiProperty({ example: 'mi-clinica-preferida', description: 'Identificador URL amigable (slug) de la institución' })
    @IsString()
    @MinLength(3)
    slug: string;

    @ApiProperty({ example: 'Ofrecemos los mejores servicios de salud', description: 'Descripción de la institución', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 'Calle 123, Ciudad Central', description: 'Dirección física', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ example: '809-555-0000', description: 'Teléfono de contacto', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'contacto@miclinica.com', description: 'Correo electrónico de contacto', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: 'https://ejemplo.com/logo.png', description: 'URL del logo', required: false })
    @IsOptional()
    @IsString()
    logo_url?: string;

    @ApiProperty({ example: false, description: 'Si true, la institución aparece en el marketplace público', required: false })
    @IsOptional()
    @IsBoolean()
    is_public?: boolean;
}
