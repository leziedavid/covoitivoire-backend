import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class DeliveryOrderDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    deliveryId: string;

    @ApiProperty()
    @IsUUID()
    customerId: string;

    @ApiProperty({ enum: OrderStatus })
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @ApiProperty({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    canceledAt?: Date;

    @ApiProperty()
    @IsDate()
    createdAt: Date;

    @ApiProperty()
    @IsDate()
    updatedAt: Date;

    @ApiProperty()
    @IsUUID()
    addedById: string;
}

export class CreateDeliveryOrderDto extends OmitType(DeliveryOrderDto, ['id', 'createdAt', 'updatedAt'] as const) { }
export class UpdateDeliveryOrderDto extends PartialType(CreateDeliveryOrderDto) { }
