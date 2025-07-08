import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { VariantType } from '@prisma/client';  // Prisma enum

export class VariantDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'Nom de la variante, ex: "Taille", "Couleur"' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Valeur de la variante, ex: "M", "Noir"' })
    @IsString()
    value: string;

    @ApiPropertyOptional({ description: 'Prix associé à cette variante' })
    @IsOptional()
    @IsNumber({}, { message: 'Le champ price doit être un nombre' })
    price?: number;

    @ApiProperty({ enum: VariantType, description: 'Type de la variante (ex: TAILLE, COULEUR)' })
    @IsEnum(VariantType)
    variantType: VariantType;

    @ApiProperty({ description: 'ID de l\'utilisateur ayant créé la variante' })
    @IsUUID()
    addedById: string;
}

export class CreateVariantDto extends OmitType(VariantDto, ['id'] as const) { }

export class UpdateVariantDto extends PartialType(CreateVariantDto) { }
