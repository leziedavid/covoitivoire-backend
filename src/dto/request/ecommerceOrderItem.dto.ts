import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional } from 'class-validator';

export class EcommerceOrderItemDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    ecommerceOrderId: string;

    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    variantId?: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    price: number;
}

export class CreateEcommerceOrderItemDto extends OmitType(EcommerceOrderItemDto, ['id'] as const) { }
export class UpdateEcommerceOrderItemDto extends PartialType(CreateEcommerceOrderItemDto) { }
