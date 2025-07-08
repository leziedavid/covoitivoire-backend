// src/wallet/wallet.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { WalletRechargeDto } from 'src/dto/request/wallet.dto';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';


@ApiTags('🚗 wallet Api')
@Controller('wallet')
@ApiBearerAuth('access-token')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    /** 💰 Endpoint pour recharger le wallet */
    @UseGuards(JwtAuthGuard)
    @Post('recharge')
    @ApiOperation({ summary: 'Recharge du portefeuille' })
    @ApiResponse({ status: 200, description: 'Recharge effectuée avec succès.' })
    @ApiResponse({ status: 401, description: 'Aucun token JWT fourni.' })
    @ApiResponse({ status: 404, description: 'Wallet non trouvé.' })
    async rechargeWallet(@Req() req: Request,@Body() dto: WalletRechargeDto,): Promise<BaseResponse<null>> {
        const user = req.user as any; // Adapté selon ton AuthGuard
        return this.walletService.rechargeWallet(
            user.userId,
            dto.amount,
            dto.paymentMethod,
            dto.rechargeType,
        );
    }
}
