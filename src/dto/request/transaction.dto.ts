// src/dto/request/transaction.dto.ts
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsInt, IsString, IsUUID } from 'class-validator';

export class TransactionDto {
    @ApiProperty({
        description: 'UUID unique de la transaction',
        example: 'f3b8a1c2-3456-7890-abcd-ef1234567890',
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'Montant de la transaction en centimes (ou unité définie)',
        example: 1500,
    })
    @IsInt()
    amount: number;

    @ApiProperty({
        description: 'Type de transaction (dépôt, paiement, commission)',
        enum: TransactionType,
        example: TransactionType.DEPOSIT,
    })
    @IsEnum(TransactionType)
    type: TransactionType;

    @ApiProperty({
        description: 'UUID du wallet associé à cette transaction',
        example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    })
    @IsUUID()
    walletId: string;

    @ApiProperty({
        description: 'Référence pour la transaction (ex: numéro de commande)',
        example: 'ORDER123456',
    })
    @IsString()
    reference: string;

    @ApiProperty({
        description: 'Date de création de la transaction',
        example: '2025-06-04T12:34:56.789Z',
    })
    createdAt: Date;
}

// Classe DTO pour la création (sans id ni createdAt)
export class CreateTransactionDto extends OmitType(TransactionDto, ['id', 'createdAt'] as const) { }

// Classe DTO pour la mise à jour (partielle)
export class UpdateTransactionDto extends PartialType(CreateTransactionDto) { }
