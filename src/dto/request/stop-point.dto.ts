// src/dto/request/stop-point.dto.ts
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsUUID } from 'class-validator';

export class StopPointDto {
    @ApiProperty({
        description: "UUID unique du point d'arrêt",
        example: "d5f7aeb2-1234-4e56-8b9c-7a9b4e7c1234",
    })
    @IsUUID()
    id: string;

    // label
    @ApiPropertyOptional({ description: ' Libellé du point d\'arrêt', example: 'Point d\'arrêt 1' })
    @ApiProperty({
        description: "Libellé du point d'arrêt",
        example: "Point d'arrêt 1",
    })
    @IsString()
    label?: string;
    
    @ApiProperty({
        description: "Latitude géographique du point d'arrêt",
        example: 48.8566,
    })
    @IsNumber()
    latitude: number;

    @ApiProperty({
        description: "Longitude géographique du point d'arrêt",
        example: 2.3522,
    })
    @IsNumber()
    longitude: number;

    @ApiProperty({
        description: "Ordre du point d'arrêt dans la séquence du trajet",
        example: 1,
    })
    @IsInt()
    order: number;
}

// Classe DTO pour création sans id
export class CreateStopPointDto extends OmitType(StopPointDto, ['id'] as const) { }

// Classe DTO pour mise à jour partielle
export class UpdateStopPointDto extends PartialType(CreateStopPointDto) { }
