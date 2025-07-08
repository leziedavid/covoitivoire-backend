import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CategoryDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    // Ajoute ici une description si tu souhaites que addedById soit envoyé explicitement (optionnel)
    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    addedById?: string;
}

export class CreateCategoryDto extends OmitType(CategoryDto, ['id','addedById'] as const) { }

// Pour mise à jour : partial (champs optionnels) sauf id obligatoire ?
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @ApiProperty()
    @IsUUID()
    id: string;
}
