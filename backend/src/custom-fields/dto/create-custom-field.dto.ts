import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FieldTypeDto {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    SELECT = 'SELECT',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    FILE = 'FILE'
}

export class CreateCustomFieldDto {
    @ApiProperty({ example: 'Número de Póliza', description: 'Nombre/Etiqueta del campo' })
    @IsString()
    @IsNotEmpty()
    label: string;

    @ApiProperty({ example: 'Ingrese su póliza', description: 'Placeholder del campo', required: false })
    @IsString()
    @IsOptional()
    placeholder?: string;

    @ApiProperty({ enum: FieldTypeDto, description: 'Tipo de dato del campo' })
    @IsEnum(FieldTypeDto)
    @IsNotEmpty()
    field_type: FieldTypeDto;

    @ApiProperty({ example: true, description: 'Indica si el campo es obligatorio', required: false })
    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @ApiProperty({ example: 'ARS Universal, Mapfre', description: 'Opciones separadas por coma (para tipo SELECT)', required: false })
    @IsString()
    @IsOptional()
    options?: string;

    @ApiProperty({ example: 1, description: 'Orden en el que aparece (0, 1, 2...)', required: false })
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;

    @ApiProperty({ example: 'uuid-servicio', description: 'ID del servicio (si está vinculado a un servicio y no a toda la institución)', required: false })
    @IsString()
    @IsOptional()
    service_id?: string;
}
