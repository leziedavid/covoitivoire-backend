// src/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'Adresse email de l’utilisateur' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'oldPassword123', description: 'Ancien mot de passe' })
    @IsNotEmpty()
    @MinLength(6)
    oldPassword: string;

    @ApiProperty({ example: 'newPassword456', description: 'Nouveau mot de passe' })
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
