// dto/base-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BaseResponse<T> {
    @ApiProperty({ description: 'Code de statut HTTP', example: 200 })
    statusCode: number;

    @ApiProperty({ description: 'Message du statut', example: 'Succès' })
    message: string;

    @ApiProperty({ description: 'Données retournées' })
    data: T;

    constructor(statusCode: number, message: string, data: T) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
