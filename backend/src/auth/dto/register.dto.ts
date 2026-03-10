import {
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
    IsIn,
} from 'class-validator';

export class RegisterDto {
    @IsString()
    full_name: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @MinLength(6)
    password: string;

    @IsString()
    @IsIn(['CLIENT', 'INSTITUTION_OWNER', 'SAAS_ADMIN'])
    role: string;

    @IsOptional()
    @IsString()
    institution_name?: string;

    @IsOptional()
    @IsString()
    institution_type_id?: string;

    @IsOptional()
    @IsString()
    institution_description?: string;

    @IsOptional()
    @IsString()
    institution_address?: string;

    @IsOptional()
    @IsString()
    institution_phone?: string;
}
