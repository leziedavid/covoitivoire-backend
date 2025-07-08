import { IsOptional, IsNumber, IsDateString, Matches, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchTripDto {
    @ApiProperty({ example: 48.8566, description: 'Latitude du point de départ' })
    @IsNumber()
    departureLatitude: number;

    @ApiProperty({ example: 2.3522, description: 'Longitude du point de départ' })
    @IsNumber()
    departureLongitude: number;

    @ApiProperty({ example: 45.7640, description: 'Latitude du point d’arrivée' })
    @IsNumber()
    arrivalLatitude: number;

    @ApiProperty({ example: 4.8357, description: 'Longitude du point d’arrivée' })
    @IsNumber()
    arrivalLongitude: number;

    @ApiProperty({ example: '2025-06-07', required: false, description: 'Date de départ (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    departureDate?: string;

    @ApiProperty({ example: '08:30', required: false, description: 'Heure de départ (HH:mm)' })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Heure de départ invalide (format HH:mm)' })
    departureTime?: string;

    @ApiProperty({ example: '2025-06-07', required: false, description: 'Date d’arrivée estimée (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    arrivalDate?: string;

    @ApiProperty({ example: '13:30', required: false, description: 'Heure d’arrivée estimée (HH:mm)' })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Heure d’arrivée invalide (format HH:mm)' })
    arrivalTime?: string;

    @ApiProperty({ example: 2, required: false, description: 'Nombre minimum de places disponibles' })
    @IsOptional()
    @IsInt()
    @Min(1)
    availableSeats?: number;

    // @ApiProperty({ example: 20, required: false, description: 'Distance maximale (en km) entre les points de départ/arrivée et la position exacte du trajet' })
    // @IsOptional()
    // @IsInt()
    // @Min(1)
    // maxDistanceKm?: number;
}
