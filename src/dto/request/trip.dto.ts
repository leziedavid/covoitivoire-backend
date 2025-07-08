import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { TripStatus } from '@prisma/client';
import {IsDate,IsEnum,IsNotEmpty,IsNumber,IsOptional,IsString,IsUUID,Min,ValidateNested,Matches,} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStopPointDto } from './stop-point.dto';

// DTO principal représentant un Trip
export class TripDto {
    @ApiProperty({ description: 'UUID unique du trajet', example: 'd6f9e21a-1234-5678-abcd-ef9012345678' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: "UUID de l'utilisateur ayant créé le trajet", example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
    @IsUUID()
    createdById: string;

    @ApiProperty({ description: 'UUID du chauffeur assigné au trajet', example: 'f7e6d5c4-b3a2-1908-7654-3210fedcba98' })
    @IsUUID()
    driverId: string;

    @ApiProperty({ description: 'UUID du véhicule utilisé pour le trajet', example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' })
    @IsUUID()
    vehicleId: string;

    @ApiProperty({ description: 'Point de départ', example: 'Paris' })
    @IsString()
    @IsNotEmpty()
    departure: string;

    @ApiProperty({ description: 'Latitude du point de départ', example: 48.8566 })
    @IsNumber()
    departureLatitude: number;

    @ApiProperty({ description: 'Longitude du point de départ', example: 2.3522 })
    @IsNumber()
    departureLongitude: number;

    @ApiProperty({ description: "Point d'arrivée", example: 'Lyon' })
    @IsString()
    @IsNotEmpty()
    arrival: string;

    @ApiProperty({ description: 'Latitude du point d’arrivée', example: 45.7640 })
    @IsNumber()
    arrivalLatitude: number;

    @ApiProperty({ description: 'Longitude du point d’arrivée', example: 4.8357 })
    @IsNumber()
    arrivalLongitude: number;

    @ApiProperty({ description: 'Date et heure de départ', example: '2025-06-15T08:30:00.000Z' })
    @IsDate()
    date: Date;

    @ApiProperty({ description: "Date et heure estimée d'arrivée", example: '2025-06-15T12:45:00.000Z' })
    @IsDate()
    estimatedArrival: Date;


    @ApiProperty({ description: 'Description du trajet', example: 'Trajet avec pauses prévues' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Instructions particulières pour le trajet', example: "Éviter l'autoroute A7" })
    @IsOptional()
    @IsString()
    instructions?: string;

    @ApiProperty({ description: 'Statut du trajet', enum: TripStatus, example: TripStatus.PENDING })
    @IsEnum(TripStatus)
    status: TripStatus;

    @ApiProperty({ description: 'Distance du trajet en kilomètres', example: 450.5 })
    @IsNumber()
    distance: number;

    @ApiProperty({ description: 'Nombre de places disponibles', example: 3 })
    @IsNumber()
    @Min(1)
    availableSeats: number;

    // price
    @ApiProperty({ description: 'Prix du trajet en euros', example: 4500 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({ description: "Date de création de l'enregistrement", example: '2025-05-01T10:00:00.000Z' })
    @IsDate()
    createdAt: Date;

    @ApiProperty({ description: "Date de mise à jour de l'enregistrement", example: '2025-05-01T12:00:00.000Z' })
    @IsDate()
    updatedAt: Date;
}



// DTO pour la création d’un trajet
export class CreateTripDto extends OmitType(TripDto, ['id', 'createdAt', 'updatedAt', 'status'] as const) {
    @ApiProperty({
        description: 'Liste des points d’arrêt (optionnels)',
        type: [CreateStopPointDto],
        required: false,
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateStopPointDto)
    stopPoints?: CreateStopPointDto[];
}

// DTO pour la mise à jour
export class UpdateTripDto extends PartialType(CreateTripDto) { }

// DTO pour la recherche de trajets

