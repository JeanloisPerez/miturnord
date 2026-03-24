import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppointmentDto {
    @ApiProperty({ example: 'CONFIRMED', description: 'Estado de la cita', required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ example: 'El cliente confirmó asistencia', description: 'Notas de la cita', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
