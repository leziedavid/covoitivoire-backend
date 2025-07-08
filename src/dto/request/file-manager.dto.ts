import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID } from 'class-validator';

export class FileManagerDto {
    @ApiProperty({
        description: 'Identifiant unique auto-incrémenté du fichier',
        example: 1,
    })
    @IsInt()
    id: number;

    @ApiProperty({
        description: 'Code unique généré pour référencer le fichier',
        example: 'user-avatar-abc123',
    })
    @IsString()
    fileCode: string;

    @ApiProperty({
        description: 'Nom original du fichier',
        example: 'profile-picture.png',
    })
    @IsString()
    fileName: string;

    @ApiProperty({
        description: 'Type MIME du fichier (image/png, application/pdf, etc.)',
        example: 'image/png',
    })
    @IsString()
    fileMimeType: string;

    @ApiProperty({
        description: 'Taille du fichier en octets',
        example: 204800,
    })
    @IsInt()
    fileSize: number;

    @ApiProperty({
        description: 'URL publique d’accès au fichier',
        example: 'https://cdn.monsite.com/uploads/user-avatar-abc123.png',
    })
    @IsString()
    fileUrl: string;

    @ApiProperty({
        description: 'Type logique du fichier : "userFiles", "vehicleFiles", "menuItemFiles", etc.',
        example: 'userFiles',
    })
    @IsString()
    fileType: string;

    @ApiProperty({
        description: 'UUID de l’élément cible auquel le fichier est lié',
        example: 'b2e41c8d-4871-46c6-8cbe-d915a9a21e31',
    })
    @IsUUID()
    targetId: string;

    @ApiProperty({
        description: 'Date de création du fichier',
        example: new Date().toISOString(),
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Date de dernière mise à jour du fichier',
        example: new Date().toISOString(),
    })
    updatedAt: Date;
}

export class CreateFileManagerDto extends OmitType(FileManagerDto, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateFileManagerDto extends PartialType(CreateFileManagerDto) { }
