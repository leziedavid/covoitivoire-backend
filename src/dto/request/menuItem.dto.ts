import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class MenuItemDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsInt()
    price: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiProperty()
    @IsBoolean()
    isAvailable: boolean;

    @ApiProperty()
    @IsUUID()
    serviceId: string;

    @ApiProperty()
    @IsUUID()
    addedById: string;
}

export class CreateMenuItemDto extends OmitType(MenuItemDto, ['id'] as const) { }
export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) { }
