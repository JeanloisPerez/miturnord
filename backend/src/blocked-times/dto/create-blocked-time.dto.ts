import { IsString, IsDateString } from 'class-validator';

export class CreateBlockedTimeDto {
    @IsString()
    branch_id: string;

    @IsDateString()
    date: string; // YYYY-MM-DD

    @IsString()
    start_time: string; // HH:MM

    @IsString()
    end_time: string; // HH:MM

    @IsString()
    reason: string;
}
