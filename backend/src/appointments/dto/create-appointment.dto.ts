import { IsString, IsISO8601, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FieldResponseDto {
    @IsString()
    field_id: string;

    @IsString()
    value: string;
}

export class CreateAppointmentDto {
    @IsString()
    institution_id: string;

    @IsString()
    service_id: string;

    @IsOptional()
    @IsString()
    branch_id?: string;

    @IsISO8601()
    date: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FieldResponseDto)
    field_responses?: FieldResponseDto[];
}
