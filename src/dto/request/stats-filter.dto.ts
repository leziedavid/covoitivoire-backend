// src/dto/request/stats-filter.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class StatsFilterDto {
    @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dateDebut?: Date;

    @ApiPropertyOptional({ example: '2025-06-10T23:59:59.000Z' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dateFin?: Date;
}
