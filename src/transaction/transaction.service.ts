import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { TransactionType } from '@prisma/client';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';

@Injectable()
export class TransactionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,
    ) { }

    /**
     * 1. ✅ Récupérer une transaction par ID
     */
    async getTransactionById(id: string): Promise<BaseResponse<any>> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                user: true,
                wallet: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction introuvable');
        }

        return new BaseResponse(200, 'Détails de la transaction', transaction);
    }

    /**
     * 2. ✅ Récupérer toutes les transactions (admin)
     */
    async getAllTransactions(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const paginateOptions: PaginateOptions = {
            model: 'Transaction',
            page: Number(page),
            limit: Number(limit),
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    user: true,
                    wallet: true,
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(paginateOptions);

        return new BaseResponse(200, 'Liste de toutes les transactions', data);
    }

    /**
     * 3. ✅ Récupérer les transactions d’un utilisateur
     */
    async getTransactionsByUser(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const paginateOptions: PaginateOptions = {
            model: 'Transaction',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                userId,
            },
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    wallet: true,
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(paginateOptions);

        return new BaseResponse(200, `Transactions de l'utilisateur ${userId}`, data);
    }

    /**
     * 4. ✅ Récupérer les transactions d’un wallet
     */
    async getTransactionsByWallet(walletId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const paginateOptions: PaginateOptions = {
            model: 'Transaction',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                walletId,
            },
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    user: true,
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(paginateOptions);

        return new BaseResponse(200, `Transactions du wallet ${walletId}`, data);
    }

    /**
     * 5. ✅ Récupérer une transaction par numéro unique
     */
    async getTransactionByNumber(transactionNumber: string): Promise<BaseResponse<any>> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { transactionNumber },
            include: {
                user: true,
                wallet: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction introuvable');
        }

        return new BaseResponse(200, 'Détails de la transaction', transaction);
    }

    /**
   * Statistiques globales par type de transaction
   */
    async getGlobalTransactionStats(): Promise<BaseResponse<any>> {
        // On calcule le total, puis par type
        const totalCount = await this.prisma.transaction.count();

        // Pour chaque type, somme des montants
        const sumsByType = await Promise.all(
            Object.values(TransactionType).map(async (type) => {
                const sum = await this.prisma.transaction.aggregate({
                    where: { type },
                    _sum: { amount: true },
                });
                return { type, amount: sum._sum.amount ?? 0 };
            })
        );

        const totalAmountAgg = await this.prisma.transaction.aggregate({
            _sum: { amount: true },
        });

        return new BaseResponse(200, 'Statistiques globales des transactions', {
            totalCount,
            totalAmount: totalAmountAgg._sum.amount ?? 0,
            sumsByType,
        });
    }
    /**
     * Statistiques utilisateur par type
     */
    async getUserTransactionStats(userId: string): Promise<BaseResponse<any>> {
        const totalCount = await this.prisma.transaction.count({ where: { userId } });

        const sumsByType = await Promise.all(
            Object.values(TransactionType).map(async (type) => {
                const sum = await this.prisma.transaction.aggregate({
                    where: { userId, type },
                    _sum: { amount: true },
                });
                return { type, amount: sum._sum.amount ?? 0 };
            })
        );

        const totalAmountAgg = await this.prisma.transaction.aggregate({
            where: { userId },
            _sum: { amount: true },
        });

        return new BaseResponse(200, 'Statistiques des transactions utilisateur', {
            totalCount,
            totalAmount: totalAmountAgg._sum.amount ?? 0,
            sumsByType,
        });
    }

    /**
     * Statistiques mensuelles par type (depuis 12 mois par défaut) pour l'utilisateurs connecté
     */

    async getMonthlyTransactionStatsByUser( userId: string, startDate?: Date, endDate?: Date): Promise<BaseResponse<any>> {
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : subMonths(end, 11);

        const months: string[] = [];
        const current = new Date(start);

        while (current <= end) {
            months.push(format(current, 'yyyy-MM'));
            current.setMonth(current.getMonth() + 1);
        }

        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startOfMonth(start),
                    lte: endOfMonth(end),
                },
            },
            select: {
                createdAt: true,
                amount: true,
                type: true,
            },
        });

        const grouped = new Map<string, Record<TransactionType, number>>();

        for (const t of transactions) {
            const key = format(t.createdAt, 'yyyy-MM');

            if (!grouped.has(key)) {
                grouped.set(key, {
                    DEPOSIT: 0,
                    PAYMENT: 0,
                    COMMISSION: 0,
                    REFUND: 0,
                });
            }

            grouped.get(key)![t.type as TransactionType] += t.amount;
        }

        const results = months.map((label) => ({
            label,
            ...(grouped.get(label) ?? {
                DEPOSIT: 0,
                PAYMENT: 0,
                COMMISSION: 0,
                REFUND: 0,
            }),
        }));

        return new BaseResponse(200, 'Statistiques mensuelles des transactions de l’utilisateur', results);
    }

    // Statistiques mensuelles  Admin des transactions
    async getMonthlyAdminTransactionStats(startDate?: Date, endDate?: Date): Promise<BaseResponse<any>> {
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : subMonths(end, 11);

        const months: string[] = [];
        const current = new Date(start);
        while (current <= end) {
            months.push(format(current, 'yyyy-MM'));
            current.setMonth(current.getMonth() + 1);
        }

        const transactions = await this.prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth(start),
                    lte: endOfMonth(end),
                },
            },
            select: {
                createdAt: true,
                amount: true,
                type: true,
            },
        });

        // Grouper par mois et type
        const grouped = new Map<
            string,
            Record<TransactionType, number>
        >();

        for (const t of transactions) {
            const key = format(t.createdAt, 'yyyy-MM');
            if (!grouped.has(key)) {
                grouped.set(key, {
                    DEPOSIT: 0,
                    PAYMENT: 0,
                    COMMISSION: 0,
                    REFUND: 0,
                });
            }
            grouped.get(key)![t.type as TransactionType] += t.amount;
        }

        // Construire résultat par mois
        const results = months.map((label) => ({
            label,
            ...grouped.get(label),
        }));

        return new BaseResponse(200, 'Statistiques mensuelles des transactions', results);
    }


}
