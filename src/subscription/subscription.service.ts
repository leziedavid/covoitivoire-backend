import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, ServiceType } from '@prisma/client';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { NotificationService } from 'src/utils/notification';
import { FunctionService } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly prisma: PrismaService,
        readonly notificationService: NotificationService,
        private readonly functionService: FunctionService,

    ) { }

    private async formatDateFr(date: Date): Promise<string> {
        return date.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    /** 🛒 Souscrire à un service avec période et paiement */
    async subscribeToService(userId: string, serviceId: string, startDate: Date, endDate: Date,): Promise<BaseResponse<any>> {

        if (!startDate || !endDate) {
            throw new BadRequestException('Les dates de début et de fin sont requises');
        }
        if (startDate >= endDate) {
            throw new BadRequestException('La date de fin doit être après la date de début');
        }

        const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) throw new NotFoundException('Service introuvable');

        // Déterminer le prix du service
        const unitPrice = service.isActivePromo ? service.promoPrice : service.price;

        // Vérifie si une souscription existe déjà avec chevauchement de période
        const existingSubscription = await this.prisma.serviceSubscription.findFirst({
            where: {
                userId,
                serviceId,
                startDate: { lte: endDate },
                endDate: { gte: startDate },
                status: {
                    not: 'CANCELLED', // On ignore les souscriptions annulées
                },
            },
        });

        if (existingSubscription) {
            throw new BadRequestException('Une souscription existe déjà pour cette période');
        }

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet utilisateur introuvable');

        // Calcul prix total selon durée
        const msInDay = 1000 * 60 * 60 * 24;
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay);

        console.log(durationDays, unitPrice, msInDay);
        const subscriptionPrice = unitPrice * durationDays;

        if (wallet.balance < subscriptionPrice) {
            throw new ForbiddenException('Solde insuffisant pour souscrire à ce service');
        }

        const now = new Date();

        const result = await this.prisma.$transaction(async (prisma) => {
            const subscription = await prisma.serviceSubscription.create({
                data: {
                    userId,
                    serviceId,
                    subscribedAt: now,
                    startDate,
                    endDate,
                },
            });

            await prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: subscriptionPrice } },
            });


            const start = await this.formatDateFr(startDate);
            const end = await this.formatDateFr(endDate);

            await prisma.transaction.create({
                data: {
                    amount: subscriptionPrice,
                    type: TransactionType.PAYMENT,
                    walletId: wallet.id,
                    userId,
                    reference: subscription.id,
                    description: `Souscription au service ${service.name} du ${start} au ${end}`,
                },
            });

            return subscription;
        });


        // --- Ici on envoie la notification email ---
        await this.notificationService.sendNotification({
            type: 'EMAIL',
            subject: `Souscription au service ${service.name} confirmée`,
            content: `Bonjour, votre souscription au service "${service.name}" a bien été enregistrée du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}. Merci pour votre confiance !`,
            userId,
            email: await this.getUserEmail(userId), // méthode pour récupérer l’email de l’utilisateur (à créer)
            options: {
                extraInfo: [
                    `Montant débité : ${subscriptionPrice} €`,
                    `Période : ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                ]
            },
        });

        return new BaseResponse(201, 'Souscription au service réussie', result);
    }

    async cancelSubscription(userId: string, subscriptionId: string): Promise<BaseResponse<any>> {
        const subscription = await this.prisma.serviceSubscription.findUnique({
            where: { id: subscriptionId },
            include: { service: true },
        });

        if (!subscription) throw new NotFoundException('Souscription non trouvée');
        if (subscription.userId !== userId) throw new ForbiddenException('Accès interdit à cette souscription');
        if (subscription.status !== 'ACTIVE') {
            throw new BadRequestException('Cette souscription est déjà annulée');
        }

        const now = new Date();
        if (now >= subscription.endDate) {
            throw new BadRequestException('La souscription est déjà expirée');
        }

        const totalDays = Math.ceil((subscription.endDate.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const usedDays = Math.ceil((now.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const remainingDays = totalDays - usedDays;

        const unitPrice = subscription.service.isActivePromo ? subscription.service.promoPrice : subscription.service.price;
        const refundAmount = Math.max(0, remainingDays * unitPrice);

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet utilisateur introuvable');

        await this.prisma.$transaction(async (prisma) => {
            // Mise à jour du statut
            await prisma.serviceSubscription.update({
                where: { id: subscriptionId },
                data: { status: 'CANCELLED' },
            });

            // Remboursement
            if (refundAmount > 0) {
                await prisma.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: { increment: refundAmount },
                    },
                });

                await prisma.transaction.create({
                    data: {
                        amount: refundAmount,
                        type: TransactionType.REFUND,
                        walletId: wallet.id,
                        userId,
                        reference: subscriptionId,
                        description: `Remboursement partiel de la souscription au service ${subscription.service.name}`,
                    },
                });
            }
        });


        // ✅ Envoi de l'email après la transaction
        await this.notificationService.sendNotification({
            type: 'EMAIL',
            subject: `Annulation de votre souscription au service ${subscription.service.name}`,
            content: `Votre souscription au service "${subscription.service.name}" a été annulée. ${refundAmount > 0 ? `Vous avez été remboursé de ${refundAmount} € pour les ${remainingDays} jours restants.` : `Aucun remboursement n'a pu être effectué car la période est écoulée.`}`,
            userId,
            email: await this.getUserEmail(userId),
            options: {
                extraInfo: refundAmount > 0
                    ? [
                        `Montant remboursé : ${refundAmount} FCFA`,
                        `Jours restants non utilisés : ${remainingDays}`
                    ]
                    : ['Aucun remboursement effectué'],
            },
        });

        return new BaseResponse(200, 'Souscription annulée avec remboursement partiel', { refundAmount, daysRefunded: remainingDays, });
    }


    // Méthode d’exemple pour récupérer l’email utilisateur
    private async getUserEmail(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.email) throw new NotFoundException('Email utilisateur introuvable');
        return user.email;
    }



    /** Souscriptions actives (non expirées) d’un utilisateur */
    async getUserSubscriptions(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const now = new Date();

        const data = await this.functionService.paginate({
            model: 'ServiceSubscription',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                userId,
                endDate: { gte: now },
            },
            selectAndInclude: {
                select: null,
                include: { service: true },
            },
            orderBy: { subscribedAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des souscriptions actives récupérées', data);
    }

    /** Toutes les souscriptions d’un utilisateur, sans filtre */
    async getAllUserSubscriptions(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'ServiceSubscription',
            page: Number(page),
            limit: Number(limit),
            conditions: { userId },
            selectAndInclude: {
                select: null,
                include: { service: true },
            },
            orderBy: { subscribedAt: 'desc' },
        });

        return new BaseResponse(200, 'Toutes les souscriptions récupérées', data);
    }

    /** Souscriptions actives filtrées par type de service */
    async getUserSubscriptionsByServiceType(
        userId: string,
        serviceType: string,
        params: PaginationParamsDto
    ): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const now = new Date();

        const data = await this.functionService.paginate({
            model: 'ServiceSubscription',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                userId,
                endDate: { gte: now },
                service: {
                    type: serviceType,
                },
            },
            selectAndInclude: {
                select: null,
                include: { service: true },
            },
            orderBy: { subscribedAt: 'desc' },
        });

        return new BaseResponse(200, `Souscriptions actives de type '${serviceType}' récupérées`, data);
    }

    /** Souscriptions expirées (endDate < date) */
    async getExpiredSubscriptions(userId: string, params: PaginationParamsDto, date?: Date): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const checkDate = date ?? new Date();

        const data = await this.functionService.paginate({
            model: 'ServiceSubscription',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                userId,
                endDate: { lt: checkDate },
            },
            selectAndInclude: {
                select: null,
                include: { service: true },
            },
            orderBy: { endDate: 'desc' },
        });

        return new BaseResponse(200, 'Souscriptions expirées récupérées', data);
    }

    /** Souscriptions expirant dans la semaine qui suit */
    async getSubscriptionsExpiringInAWeek(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const data = await this.functionService.paginate({
            model: 'ServiceSubscription',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                userId,
                endDate: {
                    gte: now,
                    lte: weekLater,
                },
            },
            selectAndInclude: {
                select: null,
                include: { service: true },
            },
            orderBy: { endDate: 'asc' },
        });

        return new BaseResponse(200, 'Souscriptions expirant dans la semaine récupérées', data);
    }



    /** 🛒 Souscrire à un service avec période et paiement */
    async subscribeToServiceLASTE(
        userId: string,
        serviceId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<BaseResponse<any>> {
        if (!startDate || !endDate) {
            throw new BadRequestException('Les dates de début et de fin sont requises');
        }
        if (startDate >= endDate) {
            throw new BadRequestException('La date de fin doit être après la date de début');
        }

        const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) throw new NotFoundException('Service introuvable');

        // Vérifie si une souscription existe déjà avec chevauchement de période
        const existingSubscription = await this.prisma.serviceSubscription.findFirst({
            where: {
                userId,
                serviceId,
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
        });
        if (existingSubscription) {
            throw new BadRequestException('Une souscription existe déjà pour cette période');
        }

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet utilisateur introuvable');

        // Calcul prix par durée (ex: 1€ par jour)
        const msInDay = 1000 * 60 * 60 * 24;
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay);

        const pricePerDay = 100; // 1,00€ en centimes par jour
        const subscriptionPrice = pricePerDay * durationDays;

        if (wallet.balance < subscriptionPrice) {
            throw new ForbiddenException('Solde insuffisant pour souscrire à ce service');
        }

        const now = new Date();

        const result = await this.prisma.$transaction(async (prisma) => {
            const subscription = await prisma.serviceSubscription.create({
                data: {
                    userId,
                    serviceId,
                    subscribedAt: now,
                    startDate,
                    endDate,
                },
            });

            await prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: subscriptionPrice } },
            });

            await prisma.transaction.create({
                data: {
                    amount: subscriptionPrice,
                    type: TransactionType.PAYMENT,
                    walletId: wallet.id,
                    userId,
                    reference: subscription.id,
                    description: `Souscription au service ${service.name} du ${startDate.toISOString()} au ${endDate.toISOString()}`,
                },
            });

            return subscription;
        });

        return new BaseResponse(201, 'Souscription au service réussie', result);
    }

    /** Liste des souscriptions actives de l’utilisateur */

    /** Souscriptions actives (non expirées) d’un utilisateur */
    async getUserSubscriptions2(userId: string): Promise<BaseResponse<any>> {
        const now = new Date();
        const subscriptions = await this.prisma.serviceSubscription.findMany({
            where: {
                userId,
                endDate: {
                    gte: now,  // uniquement les abonnements non expirés
                },
            },
            include: { service: true },
            orderBy: { subscribedAt: 'desc' },
        });
        return new BaseResponse(200, 'Liste des souscriptions actives récupérées', subscriptions);
    }

    /** Toutes les souscriptions d’un utilisateur, sans filtre */
    async getAllUserSubscriptions2(userId: string): Promise<BaseResponse<any>> {
        const subscriptions = await this.prisma.serviceSubscription.findMany({
            where: { userId },
            include: { service: true },
            orderBy: { subscribedAt: 'desc' },
        });
        return new BaseResponse(200, 'Toutes les souscriptions récupérées', subscriptions);
    }

    /** Souscriptions actives filtrées par type de service (ex: livraison, restaurant, etc.) */
    async getUserSubscriptionsByServiceType2(userId: string, serviceType: string): Promise<BaseResponse<any>> {
        const now = new Date();
        // Import ServiceType enum from your Prisma client
        // If not already imported, add: import { ServiceType } from '@prisma/client';

        const subscriptions = await this.prisma.serviceSubscription.findMany({
            where: {
                userId,
                endDate: { gte: now },
                service: {
                    type: serviceType as ServiceType,  // filtre par type de service
                },
            },
            include: { service: true },
            orderBy: { subscribedAt: 'desc' },
        });

        return new BaseResponse(200, `Souscriptions actives de type '${serviceType}' récupérées`, subscriptions);
    }

    /** Souscriptions expirées (endDate < date) */
    async getExpiredSubscriptions2(userId: string, date?: Date): Promise<BaseResponse<any>> {
        const checkDate = date ?? new Date();

        const expiredSubscriptions = await this.prisma.serviceSubscription.findMany({
            where: {
                userId,
                endDate: { lt: checkDate },
            },
            include: { service: true },
            orderBy: { endDate: 'desc' },
        });

        return new BaseResponse(200, 'Souscriptions expirées récupérées', expiredSubscriptions);
    }

    /** Souscriptions expirant dans la semaine qui suit */
    async getSubscriptionsExpiringInAWeek2(userId: string): Promise<BaseResponse<any>> {
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const expiringSoon = await this.prisma.serviceSubscription.findMany({
            where: {
                userId,
                endDate: {
                    gte: now,
                    lte: weekLater,
                },
            },
            include: { service: true },
            orderBy: { endDate: 'asc' },
        });

        return new BaseResponse(200, 'Souscriptions expirant dans la semaine récupérées', expiringSoon);
    }

}
