import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID, IsNumber } from 'class-validator';

export class RestaurantOrderItemDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    restaurantOrderId: string;

    @ApiProperty()
    @IsUUID()
    menuItemId: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    price: number;
}

export class CreateRestaurantOrderItemDto extends OmitType(RestaurantOrderItemDto, ['id'] as const) { }
export class UpdateRestaurantOrderItemDto extends PartialType(CreateRestaurantOrderItemDto) { }
