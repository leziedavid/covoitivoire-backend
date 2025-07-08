import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'John Doe', description: 'Nouveau nom' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'newPassword456', description: 'Nouveau mot de passe (6 caractères min.)' })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional({ enum: Role, example: Role.ADMIN, description: 'Nouveau rôle' })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE, description: 'Nouveau statut du compte' })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({ example: '+225', description: 'Code pays du téléphone (optionnel)' })
    @IsOptional()
    @IsString()
    phoneCountryCode?: string;

    @ApiPropertyOptional({ example: '0612345678', description: 'Numéro de téléphone (optionnel)' })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'Nouvelle image de profil (fichier binaire)',
    })
    @IsOptional()
    file?: any;


    // Image de la   carte nationale didentité
    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'Image de la carte nationale didentité (fichier binaire)',
    })
    @IsOptional()
    carte?: any;

 // image du permis de conduite
    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'image du permis de conduite (fichier binaire)',
    })
    @IsOptional()
    permis?: any;
    
}
