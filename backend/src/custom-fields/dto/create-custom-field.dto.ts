import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

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
    @IsString()
    @IsNotEmpty()
    label: string;

    @IsString()
    @IsOptional()
    placeholder?: string;

    @IsEnum(FieldTypeDto)
    @IsNotEmpty()
    field_type: FieldTypeDto;

    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @IsString()
    @IsOptional()
    options?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    service_id?: string;
}
