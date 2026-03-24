import { IsString, IsISO8601, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FieldResponseDto {
    @ApiProperty({ example: 'uuid-campo', description: 'ID del campo personalizado' })
    @IsString()
    field_id: string;

    @ApiProperty({ example: 'Respuesta del usuario', description: 'Valor proporcionado por el usuario' })
    @IsString()
    value: string;
}

export class CreateAppointmentDto {
    @ApiProperty({ example: 'uuid-institucion', description: 'ID de la institución' })
    @IsString()
    institution_id: string;

    @ApiProperty({ example: 'uuid-servicio', description: 'ID del servicio a reservar' })
    @IsString()
    service_id: string;

    @ApiProperty({ example: 'uuid-sucursal', description: 'ID de la sucursal (opcional)', required: false })
    @IsOptional()
    @IsString()
    branch_id?: string;

    @ApiProperty({ example: '2023-10-15T10:30:00Z', description: 'Fecha y hora de la cita en formato ISO8601' })
    @IsISO8601()
    date: string;

    @ApiProperty({ example: 'Llegaré 5 minutos tarde', description: 'Notas adicionales del cliente', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ type: [FieldResponseDto], description: 'Respuestas a campos personalizados', required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FieldResponseDto)
    field_responses?: FieldResponseDto[];
}
