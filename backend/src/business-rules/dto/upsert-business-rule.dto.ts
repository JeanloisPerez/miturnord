import { IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertBusinessRuleDto {
    @ApiProperty({ example: true, description: 'Confirmar automáticamente las citas', required: false })
    @IsOptional() @IsBoolean()
    auto_confirm?: boolean;

    @ApiProperty({ example: 15, description: 'Minutos de reserva entre citas', required: false })
    @IsOptional() @IsInt() @Min(0) @Max(120)
    buffer_minutes?: number;

    @ApiProperty({ example: 1, description: 'Cantidad máxima de citas por bloque de tiempo', required: false })
    @IsOptional() @IsInt() @Min(1) @Max(50)
    max_per_slot?: number;

    @ApiProperty({ example: 15, description: 'Minutos de tolerancia para llegadas tardías', required: false })
    @IsOptional() @IsInt() @Min(5) @Max(120)
    no_show_minutes?: number;

    @ApiProperty({ example: 30, description: 'Días máximos de anticipación para reservar', required: false })
    @IsOptional() @IsInt() @Min(1) @Max(365)
    advance_book_days?: number;
}
