import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsInt,
    IsArray,
    ValidateNested,
    IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Express } from 'express';
import { VariantType } from '@prisma/client';

export class ProductDto {
    @ApiProperty({ example: 'uuid' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'T-shirt noir' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Un T-shirt confortable pour l’été.' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 49.99 })
    @Type(() => Number)
    @IsNumber()
    price: number;

    @ApiProperty({ example: 10 })
    @Type(() => Number)
    @IsInt()
    stock: number;

    // @ApiProperty({ example: 'TSHIRT-NOIR-M' })
    // @IsString()
    // sku: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'Image principale (upload)',
    })
    @IsOptional()
    imageFile?: Express.Multer.File;

    @ApiPropertyOptional({
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Images secondaires (upload)',
    })
    @IsOptional()
    @IsArray()
    files?: Express.Multer.File[];

    @ApiProperty({ example: 'uuid-category-123' })
    @IsUUID()
    categoryId: string;

    @ApiProperty({ example: 'uuid-service-123' })
    @IsUUID()
    serviceId: string;

    // variantType
    @ApiProperty({ enum: VariantType, example: VariantType.COULEUR, description: 'Type de variante'})
    @IsEnum(VariantType)
    variantType?: VariantType;

    @ApiProperty({
        description: 'Liste des IDs de variantes associées',
        example: ['uuid-var1', 'uuid-var2'],
    })
    @IsArray()
    @IsUUID(undefined, { each: true })
    @Transform(({ value }) => {
        // Si c'est une chaîne JSON, on la parse en tableau
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return [value]; // Fallback pour une valeur unique, si l'analyse échoue
            }
        }
        return value;
    })
    variantIds: string[];
}

export class CreateProductDto extends OmitType(ProductDto, ['id'] as const) { }

export class UpdateProductDto extends PartialType(CreateProductDto) { }
