import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';

export class UserResponseDto {
    @ApiProperty({ example: 'clm9f87e70000t1xob78yxjwf', description: 'ID utilisateur' })
    id: string;

    @ApiProperty({ example: 'user@example.com', description: 'Adresse email' })
    email: string;

    @ApiProperty({ example: 'John Doe', description: 'Nom complet' })
    name: string;

    @ApiProperty({ enum: Role, example: Role.USER, description: 'Rôle de l’utilisateur' })
    role: Role;

    @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, description: 'Statut du compte' })
    status: UserStatus;

    @ApiProperty({ example: '2025-06-01T12:00:00.000Z', description: 'Date de création' })
    createdAt: Date;

    @ApiProperty({ example: '2025-06-01T12:30:00.000Z', description: 'Date de mise à jour' })
    updatedAt: Date;

    @ApiProperty({
        type: () => FileResponseDto,
        nullable: true,
        description: 'Image de profil liée via FileManager',
    })
    file?: FileResponseDto | null;
}

export class FileResponseDto {
    @ApiProperty({ example: 'clm9f87400000t1xob78yxjvv', description: 'ID du fichier' })
    id: string;

    @ApiProperty({ example: 'userFiles', description: 'Type de fichier (userFiles, vehicleFiles, etc.)' })
    type: string;

    @ApiProperty({ example: 'user-avatar.jpg', description: 'Nom du fichier' })
    filename: string;

    @ApiProperty({ example: 'https://yourcdn.com/uploads/user-avatar.jpg', description: 'URL accessible du fichier' })
    url: string;

    @ApiProperty({ example: '2025-06-01T12:00:00.000Z', description: 'Date d’upload' })
    createdAt: Date;
}
