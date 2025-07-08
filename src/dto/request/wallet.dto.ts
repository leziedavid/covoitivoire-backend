
// src/wallet/dto/wallet-recharge.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export enum RechargeType {
    WAVE = 'WAVE',
    ORANGE_MONEY = 'ORANGE_MONEY',
    MTN_MOBILE_MONEY = 'MTN_MOBILE_MONEY',
    CARD = 'CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
    MOOV_MOBILE_MONEY = 'MOOV_MOBILE_MONEY',
}

export class WalletRechargeDto {
    
    @ApiProperty({ example: '6f9e21a-1234-5678-abcd-ef9012345678', description: 'Identifiant de l\'utilisateur' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ example: 12.5, description: 'Montant à recharger en euros' })
    @IsNumber()
    @Min(1, { message: 'Le montant doit être supérieur à 0.' })
    amount: number;

    @ApiProperty({ enum: PaymentMethod, description: 'Type de paiement' })
    @IsEnum(PaymentMethod)
    @IsOptional()
    paymentMethod?: PaymentMethod = PaymentMethod.MOBILE_MONEY;


    @ApiProperty({ enum: RechargeType, description: 'Type de recharge' })
    @IsString()
    @IsOptional()
    rechargeType?: string = 'WAVE';
}
