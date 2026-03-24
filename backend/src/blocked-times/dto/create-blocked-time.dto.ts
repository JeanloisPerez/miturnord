import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlockedTimeDto {
    @ApiProperty({ example: 'uuid-sucursal', description: 'ID de la sucursal' })
    @IsString()
    branch_id: string;

    @ApiProperty({ example: '2023-11-01', description: 'Fecha del bloqueo (YYYY-MM-DD)' })
    @IsDateString()
    date: string; // YYYY-MM-DD

    @ApiProperty({ example: '14:00', description: 'Hora de inicio (HH:MM)' })
    @IsString()
    start_time: string; // HH:MM

    @ApiProperty({ example: '16:00', description: 'Hora de fin (HH:MM)' })
    @IsString()
    end_time: string; // HH:MM

    @ApiProperty({ example: 'Fumigación del local', description: 'Razón del bloqueo' })
    @IsString()
    reason: string;
}
