import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBranchDto {
    @ApiProperty({ example: 'uuid-institucion', description: 'ID de la institución a la que pertenece la sucursal' })
    @IsString()
    institution_id: string;

    @ApiProperty({ example: 'Sucursal Piantini', description: 'Nombre de la sucursal' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Av. Winston Churchill', description: 'Dirección física', required: false })
    @IsOptional() @IsString()
    address?: string;

    @ApiProperty({ example: 'Santo Domingo', description: 'Ciudad', required: false })
    @IsOptional() @IsString()
    city?: string;

    @ApiProperty({ example: '809-555-2222', description: 'Teléfono de contacto de la sucursal', required: false })
    @IsOptional() @IsString()
    phone?: string;

    @ApiProperty({ example: 18.4862, description: 'Latitud', required: false })
    @IsOptional() @IsNumber()
    latitude?: number;

    @ApiProperty({ example: -69.9324, description: 'Longitud', required: false })
    @IsOptional() @IsNumber()
    longitude?: number;

    @ApiProperty({ example: true, description: 'Indica si es la sucursal principal', required: false, default: false })
    @IsOptional() @IsBoolean()
    is_main?: boolean;
}
