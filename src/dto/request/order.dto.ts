import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class OrderDto {
    @ApiProperty({ description: 'ID unique de la commande', example: 'a3f1b54e-918d-4c99-bc7e-0a6d3d45c7fa' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: "ID de l'utilisateur ayant passé la commande", example: 'b2e41c8d-4871-46c6-8cbe-d915a9a21e31' })
    @IsUUID()
    userId: string;

    @ApiProperty({ description: 'ID du trajet associé à la commande', example: 'd9271d73-6d78-4e20-84dc-6e4e5e77472f' })
    @IsUUID()
    tripId: string;

    @ApiProperty({ enum: OrderStatus, description: 'Statut actuel de la commande', example: OrderStatus.PENDING })
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @ApiProperty({ enum: PaymentMethod, description: 'Méthode de paiement choisie', example: PaymentMethod.IMMEDIATE })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: 'Date d\'annulation de la commande, si applicable', example: '2025-06-05T14:30:00.000Z', })
    @IsOptional()
    canceledAt?: Date;

    @ApiProperty({ description: 'Date de création de la commande', example: new Date().toISOString() })
    createdAt: Date;

    @ApiProperty({ description: 'Date de la dernière mise à jour de la commande', example: '2025-06-05T13:20:00.000Z',})
    updatedAt: Date;
}

/** ✅ DTO utilisé lors de la création d'une commande */
export class CreateOrderDto extends OmitType(OrderDto, ['id', 'status', 'canceledAt', 'createdAt', 'updatedAt'] as const) { }
/** 🔄 DTO utilisé lors de la mise à jour partielle d'une commande */
export class UpdateOrderDto extends PartialType(OmitType(OrderDto, ['userId', 'tripId'] as const)) { }
