import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { PaymentMethod, TransactionType } from '@prisma/client';

@Injectable()
export class WalletService {
    constructor(private readonly prisma: PrismaService) { }

    /** 💰 Recharge du portefeuille */
    async rechargeWallet( userId: string,amount: number,paymentMethod: PaymentMethod = PaymentMethod.MOBILE_MONEY,rechargeType: string = 'WAVE',): Promise<BaseResponse<null>> {
        if (amount <= 0) {
            throw new BadRequestException('Le montant doit être supérieur à 0.');
        }
        
        // Vérifie si l'utilisateur a un wallet
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            throw new NotFoundException('Wallet non trouvé.');
        }

        try {
            // Mise à jour du solde et informations de recharge
            await this.prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                    paymentMethod,
                    rechargeType,
                },
            });

            // Création d’une transaction de type DEPOT
            await this.prisma.transaction.create({
                data: {
                    amount,
                    type: TransactionType.DEPOSIT,
                    walletId: wallet.id,
                    userId,
                    description: `Recharge via ${rechargeType} (${paymentMethod})`,
                },
            });

            return new BaseResponse(200, 'Recharge effectuée avec succès', null);
        } catch (error) {
            console.error('Erreur lors de la recharge du wallet:', error);
            throw new InternalServerErrorException('Erreur lors de la recharge du wallet');
        }
    }
    
}
