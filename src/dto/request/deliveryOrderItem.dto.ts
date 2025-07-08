import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID } from 'class-validator';

export class DeliveryOrderItemDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    deliveryOrderId: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    price: number;
}

export class CreateDeliveryOrderItemDto extends OmitType(DeliveryOrderItemDto, ['id'] as const) { }
export class UpdateDeliveryOrderItemDto extends PartialType(CreateDeliveryOrderItemDto) { }
