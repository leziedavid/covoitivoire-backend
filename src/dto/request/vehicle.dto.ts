import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';


export class VehicleDto {
    @ApiProperty({
        description: 'UUID unique du véhicule',
        example: 'c1234567-89ab-cdef-0123-456789abcdef',
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'Nom personnalisé du véhicule',
        example: 'Véhicule personnel de Jean',
    })
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiProperty({ description: 'Marque du véhicule', example: 'Toyota' })
    @IsString()
    brand: string;

    @ApiProperty({ description: 'Capacité maximale de passagers', example: 4 })
    @IsInt()
    @Min(1)
    capacity: number;

    @ApiProperty({ description: 'Type de carburant', example: 'essence' })
    @IsString()
    fuel: string;

    @ApiProperty({ description: 'Couleur du véhicule', example: 'bleu' })
    @IsString()
    color: string;

    @ApiProperty({ description: 'Modèle du véhicule', example: 'Corolla' })
    @IsString()
    model: string;

    @ApiProperty({
        description: "Numéro d'immatriculation (carte grise)",
        example: '123456789XYZ',
    })
    @IsString()
    registration: string;

    @ApiProperty({
        description: 'Plaque d\'immatriculation visible',
        example: 'AB-123-CD',
    })
    @IsString()
    licensePlate: string;

    @ApiProperty({
        description: 'Numéro de série du véhicule (châssis)',
        example: 'VF1ABCDE123456789',
    })
    @IsString()
    serialNumber: string;

    @ApiProperty({
        description: 'Type de véhicule',
        example: 'ECONOMIQUE',
        enum: VehicleType,
    })
    @IsEnum(VehicleType)
    type: VehicleType;

    @ApiProperty({
        description: 'UUID du partenaire propriétaire du véhicule',
        example: 'd2345678-9abc-def0-1234-56789abcdef0',
    })
    @IsUUID()
    partnerId: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary',description: 'Image de profil (fichier binaire)',})
    @IsOptional()
    file?: any;
}

// Crée une classe en omettant 'id'
export class CreateVehicleDto extends OmitType(VehicleDto, ['id'] as const) { }

// Crée une classe partielle (pour update)
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) { }

