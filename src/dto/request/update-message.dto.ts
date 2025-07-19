import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'Texte mis à jour du message' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'ID du message auquel on répond (mise à jour possible)' })
  @IsOptional()
  @IsNumber()
  repliedToId?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Fichier image (imageUrl) à envoyer avec le message',
  })
  @IsOptional()
  file?: any;


}
