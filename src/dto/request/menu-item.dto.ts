import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID } from 'class-validator';

export class MenuItemDto {
    @ApiProperty({
        description: 'UUID unique du menu item',
        example: 'a13f8c18-4c17-4e19-8f2d-1e67c1c9e23e',
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'UUID du service auquel ce menu item est associé',
        example: 'fa19e3b3-07f1-43ad-8c33-c912c432a1b6',
    })
    @IsUUID()
    serviceId: string;

    @ApiProperty({
        description: 'Nom du menu item',
        example: 'Burger classique',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Prix du menu item (en centimes ou unité entière selon votre convention)',
        example: 990,
    })
    @IsInt()
    price: number;
}

export class CreateMenuItemDto extends OmitType(MenuItemDto, ['id'] as const) { }

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) { }
