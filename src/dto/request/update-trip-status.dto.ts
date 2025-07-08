// src/dto/request/update-trip-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTripStatusDto {
    
    @ApiProperty({
        description: 'status du trajet',
        example: 'PENDING',
        enum: TripStatus,
    })
    @IsEnum(TripStatus)
    status: TripStatus;
}
