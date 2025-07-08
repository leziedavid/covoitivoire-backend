import {ApiProperty,ApiPropertyOptional,PartialType,PickType,} from '@nestjs/swagger';
import {DeliveryAssignmentStatus,DeliveryStatus,} from '@prisma/client';
import {IsEnum,IsNumber,IsOptional,IsString,IsUUID,ValidateNested,} from 'class-validator';
import { Type } from 'class-transformer';

// DTO pour un colis (Package)
export class PackageDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    deliveryId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    weight?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    length?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    width?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    height?: number;
}

// DTO pour une tentative de livraison par un livreur
export class DeliveryAssignmentDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    deliveryId: string;

    @ApiProperty()
    @IsUUID()
    driverId: string;

    @ApiProperty({ enum: DeliveryAssignmentStatus })
    @IsEnum(DeliveryAssignmentStatus)
    status: DeliveryAssignmentStatus;

    @ApiPropertyOptional()
    @IsOptional()
    acceptedAt?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    completedAt?: Date;
}

// DTO principal complet de Delivery
export class DeliveryDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    pickupAddress: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    pickupLat?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    pickupLng?: number;

    @ApiProperty()
    @IsString()
    dropAddress: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    dropLat?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    dropLng?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    scheduledAt?: Date;

    @ApiProperty({ enum: DeliveryStatus })
    @IsEnum(DeliveryStatus)
    status: DeliveryStatus;

    @ApiProperty()
    @IsUUID()
    serviceId: string;

    @ApiProperty()
    @IsUUID()
    customerId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    driverId?: string;

    @ApiProperty()
    @IsUUID()
    addedById: string;

    @ApiPropertyOptional({ type: [PackageDto] })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PackageDto)
    packages?: PackageDto[];

    @ApiPropertyOptional({ type: [DeliveryAssignmentDto] })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DeliveryAssignmentDto)
    assignments?: DeliveryAssignmentDto[];
}

// DTO de création (inclut serviceId)
export class CreateDeliveryDto extends PartialType(
    PickType(DeliveryDto, [
        'pickupAddress',
        'pickupLat',
        'pickupLng',
        'dropAddress',
        'dropLat',
        'dropLng',
        'description',
        'scheduledAt',
        'serviceId',
        'customerId',
        'addedById',
        'packages',
    ]),
) { }

// DTO de mise à jour
export class UpdateDeliveryDto extends PartialType(CreateDeliveryDto) { }
