import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { IsDate, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class EcommerceOrderDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    userId: string;

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

export class CreateEcommerceOrderDto extends OmitType(EcommerceOrderDto, ['id', 'createdAt', 'updatedAt'] as const) { }
export class UpdateEcommerceOrderDto extends PartialType(CreateEcommerceOrderDto) { }
