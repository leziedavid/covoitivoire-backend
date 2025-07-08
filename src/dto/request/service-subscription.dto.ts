import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDate, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class ServiceSubscriptionDto {
    @ApiProperty({
        description: 'UUID unique de la souscription',
        example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
    })
    @IsUUID()
    id: string;
    
    @ApiProperty({
        description: 'UUID du service souscrit',
        example: 'service-uuid-1234-5678-9012-abcdefabcdef',
    })
    @IsUUID()
    serviceId: string;

    @ApiProperty({
        description: 'Date de souscription',
        example: '2025-06-10T12:34:56Z',
    })
    @IsDate()
    subscribedAt: Date;

    @ApiProperty({
        description: 'Date de début de la période de validité',
        example: '2025-06-10T12:34:56Z',
    })
    @IsDate()
    startDate: Date;

    @ApiProperty({
        description: 'Date de fin de la période de validité',
        example: '2025-07-10T12:34:56Z',
    })
    @IsDate()
    endDate: Date;
}

// Création sans id, subscribedAt (géré par DB), startDate et endDate à fournir côté service ou client
export class CreateServiceSubscriptionDto extends OmitType(ServiceSubscriptionDto, ['id', 'subscribedAt'] as const) { }

// Update partiel
export class UpdateServiceSubscriptionDto extends PartialType(CreateServiceSubscriptionDto) { }
