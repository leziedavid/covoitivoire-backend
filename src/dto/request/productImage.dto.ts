import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ProductImageDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiProperty()
    @IsString()
    allImageUrl: string;
}

export class CreateProductImageDto extends OmitType(ProductImageDto, ['id'] as const) { }
export class UpdateProductImageDto extends PartialType(CreateProductImageDto) { }
