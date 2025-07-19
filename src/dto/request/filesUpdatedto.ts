import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class FilesUpdateDto {
    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'Image de profil (fichier binaire)',
    })
    @IsOptional()
    file?: any;
}
