import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBranchDto {
    @IsString()
    institution_id: string;

    @IsString()
    name: string;

    @IsOptional() @IsString()
    address?: string;

    @IsOptional() @IsString()
    city?: string;

    @IsOptional() @IsString()
    phone?: string;

    @IsOptional() @IsNumber()
    latitude?: number;

    @IsOptional() @IsNumber()
    longitude?: number;

    @IsOptional() @IsBoolean()
    is_main?: boolean;
}
