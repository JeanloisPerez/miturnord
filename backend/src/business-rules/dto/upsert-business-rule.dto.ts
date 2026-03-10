import { IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpsertBusinessRuleDto {
    @IsOptional() @IsBoolean()
    auto_confirm?: boolean;

    @IsOptional() @IsInt() @Min(0) @Max(120)
    buffer_minutes?: number;

    @IsOptional() @IsInt() @Min(1) @Max(50)
    max_per_slot?: number;

    @IsOptional() @IsInt() @Min(5) @Max(120)
    no_show_minutes?: number;

    @IsOptional() @IsInt() @Min(1) @Max(365)
    advance_book_days?: number;
}
