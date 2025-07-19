import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsEnum,
    IsArray,
    ValidateNested,
    IsNumber,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, DeliveryMethod } from '@prisma/client';

export class DeliveryDetailsDto {
    @ApiProperty({ example: 'Jean Dupont' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'jean.dupont@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '+225 01234567' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ example: 'Entreprise XYZ' })
    @IsOptional()
    @IsString()
    company?: string;

    @ApiPropertyOptional({ example: 'FR123456789' })
    @IsOptional()
    @IsString()
    vat?: string;
}

export class OrderItemDto {
    @ApiProperty({ example: '69d5fe1d-fc70-4c4d-9353-54dfaa6059f0' })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ example: 2 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ example: 49.99 })
    @IsNumber()
    @Min(0)
    price: number;
}

export class CreateEcommerceOrderDto {
    @ApiProperty({ type: DeliveryDetailsDto })
    @ValidateNested()
    @Type(() => DeliveryDetailsDto)
    deliveryDetails: DeliveryDetailsDto;

    @ApiProperty({
        enum: PaymentMethod,
        example: PaymentMethod.ON_ARRIVAL,
    })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({
        enum: DeliveryMethod,
        example: DeliveryMethod.HOME_DELIVERY,
    })
    @IsEnum(DeliveryMethod)
    deliveryMethod: DeliveryMethod;

    @ApiPropertyOptional({ example: 'PROMO2025' })
    @IsOptional()
    @IsString()
    promoCode?: string;

    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({ example: 99.98 })
    @IsNumber()
    @Min(0)
    amount: number;
}
