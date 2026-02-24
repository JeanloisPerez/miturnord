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
    @IsIn(['CLIENT', 'INSTITUTION_USER'])
    role: string;

    @IsOptional()
    @IsString()
    institution_name?: string;
}