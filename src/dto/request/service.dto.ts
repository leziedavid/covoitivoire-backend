import {
    ApiProperty,
    ApiPropertyOptional,
    OmitType,
    PartialType,
} from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { ServiceType } from '@prisma/client';

export class ServiceDto {
    @ApiProperty({ description: 'UUID unique du service', example: 'uuid-service-1234' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'Nom du service', example: 'Livraison' })
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ description: 'Description du service', example: 'Service de livraison rapide' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Type du service', enum: ServiceType, example: ServiceType.DELIVERY })
    @IsEnum(ServiceType)
    type: ServiceType;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: "Fichier image du service",
    })
    @IsOptional()
    file?: any;

    @ApiPropertyOptional({ description: 'Icône du service', example: 'https://res.cloudinary.com/ton_cloud/image/upload/v1234567890/services/icon-service-1.png' })
    @IsOptional()
    icon?: string;

    @ApiProperty({ description: 'UUID du partenaire créateur du service', example: 'uuid-partner-1234' })
    @IsUUID()
    partnerId: string;

    // ✅ Champs ajoutés
    @ApiProperty({ description: 'Prix du service', example: 100.0 })
    @IsNumber()
    price: number;

    @ApiPropertyOptional({ description: 'Prix promotionnel du service', example: 80.0 })
    @IsOptional()
    @IsNumber()
    promoPrice?: number;

    @ApiPropertyOptional({ description: 'Promo active ou non', example: false })
    @IsOptional()
    @IsBoolean()
    isActivePromo?: boolean;

    @ApiPropertyOptional({ description: 'Statut actif du service', example: true })
    @IsOptional()
    @IsBoolean()
    statusService?: boolean;
}

export class CreateServiceDto extends OmitType(ServiceDto, ['id'] as const) { }

export class UpdateServiceDto extends PartialType(CreateServiceDto) { }


// {
//   "userId": "5e126ef3-1e5b-4484-be32-d8c9f83992e2",
//   "serviceId": "1a13cacf-ce8b-4bb4-85c1-671f5c7cad49",
//   "startDate": "2025-06-10T12:34:56Z",
//   "endDate": "2025-08-10T12:34:56Z"
// }