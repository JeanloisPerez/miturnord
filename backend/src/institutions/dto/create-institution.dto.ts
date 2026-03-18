import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class CreateInstitutionDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    institution_type_id: string;

    @IsString()
    @MinLength(3)
    slug: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    logo_url?: string;
}

