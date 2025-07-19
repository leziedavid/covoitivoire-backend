import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class RegisterDto {
    @ApiProperty({ example: 'user@gmail.com', description: 'Adresse email' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'John Doe', description: 'Nom complet' })
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'password123', description: 'Mot de passe (6 caractères min.)' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ enum: Role, example: Role.USER, description: 'Rôle de l’utilisateur' })
    @IsEnum(Role)
    role: Role;

    @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.INACTIVE, description: 'Statut du compte (optionnel)' })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({ example: '+225', description: 'Code pays du téléphone (optionnel)' })
    @IsNotEmpty()
    @IsString()
    phoneCountryCode?: string;

    @ApiPropertyOptional({ example: '0612345678', description: 'Numéro de téléphone (optionnel)' })
    @IsNotEmpty()
    @IsString()
    phoneNumber?: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'Image de profil (fichier binaire)',
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
