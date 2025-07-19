import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException, } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, TransactionType, TripStatus } from '@prisma/client';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { NotificationsGateway } from 'src/notifications-gateway/notifications.gateway';
import { FunctionService } from 'src/utils/pagination.service';

@Injectable()
export class OrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsGateway: NotificationsGateway, // <= injecté ic
        private readonly functionService: FunctionService,
       
    ) { }



    /** 🔢 Génère un numéro de commande unique */
    private async generateOrderNumber(): Promise<string> {
        const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 chiffres
        return `CMD-${datePart}-${randomPart}`;
    }

    /** 🛒 Passer une commande sur un trajet */
    async createOrder(userId: string, tripId: string): Promise<BaseResponse<any>> {
        // Récupérer le trajet
        
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: { createdBy: true },
        });

        if (!trip) throw new NotFoundException('Trajet introuvable');

        // Vérifier si l'utilisateur est le créateur du trajet
        if (trip.createdById === userId) {
            throw new ForbiddenException('Vous ne pouvez pas commander sur votre propre trajet');
        }

        // Vérifier le statut du trajet
        if (trip.status !== TripStatus.PENDING && trip.status !== TripStatus.VALIDATED) {
            throw new BadRequestException('Ce trajet n\'est pas disponible pour les commandes');
        }

        // Vérifier le nombre de places disponibles
        if (trip.availableSeats <= 0) {
            throw new BadRequestException('Aucune place disponible sur ce trajet');
        }

        // 1️⃣ Générer un numéro unique
        const orderNumber = await this.generateOrderNumber();

        // Créer la commande avec le numéro
        const order = await this.prisma.order.create({
            data: {
                user: { connect: { id: userId } },
                trip: { connect: { id: tripId } },
                paymentMethod: 'ON_ARRIVAL', // ou 'ON_ARRIVAL' selon votre logique
                orderNumber,
            },
        });

        // Réduire le nombre de places disponibles
        await this.prisma.trip.update({
            where: { id: tripId },
            data: { availableSeats: { decrement: 1 } },
        });

        // ✅ Notifier le conducteur lié à ce trajet
        this.notificationsGateway.sendToUser(trip.driverId, 'new-order', {
            orderId: order.id,
            tripId: trip.id,
            message: 'Nouvelle commande reçue',
        });

        return new BaseResponse(201, 'Commande créée avec succès', order);
    }

    /** ❌ Annuler une commande */
    async validateOrder(driverId: string, orderId: string): Promise<BaseResponse<any>> {
        // Récupérer la commande avec le trajet
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { trip: { include: { driver: true } } },
        });

        if (!order) throw new NotFoundException('Commande introuvable');

        // Vérifier que le valideur est bien le conducteur du trajet
        if (order.trip.driverId !== driverId) {
            throw new ForbiddenException('Vous n\'êtes pas autorisé à valider cette commande');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Seules les commandes en attente peuvent être validées');
        }

        // Mise à jour du statut de commande
        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.VALIDATED },
        });

        // 💰 Calcul de la commission (18 %)
        const commission = Math.round(order.amount * 0.18);

        // 🔍 Récupérer le wallet du créateur du trajet
        const wallet = await this.prisma.wallet.findFirst({
            where: { userId: order.trip.createdById },
        });
        if (!wallet) throw new NotFoundException('Wallet du créateur de trajet introuvable');

        // ⚠️ Vérifier qu’il y a assez d’argent
        if (wallet.balance < commission) {
            throw new BadRequestException('Solde insuffisant pour payer la commission');
        }

        // 💳 Débiter la commission
        await this.prisma.$transaction([
            
            this.prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: commission } },
            }),
            this.prisma.transaction.create({
                data: {
                    userId: order.trip.createdById,
                    walletId: wallet.id,
                    amount: commission,
                    type: TransactionType.COMMISSION,
                    reference: order.id,
                    description: `Commission de 18% prélevée pour la commande ${order.id}`,
                },
            }),
        ]);

        // ➕ Notification au client
        this.notificationsGateway.sendToUser(order.userId, 'order-validated', {
            orderId: order.id,
            message: 'Votre commande a été validée par le conducteur.',
        });

        return new BaseResponse(200, 'Commande validée avec succès', null);
    }

    async cancelOrder(userId: string, orderId: string): Promise<BaseResponse<any>> {
        // Récupérer la commande et son trajet
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { trip: true },
        });

        if (!order) throw new NotFoundException('Commande introuvable');

        if (order.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez pas annuler cette commande');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Seules les commandes en attente peuvent être annulées');
        }

        // Mise à jour du statut
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.CANCELLED,
                canceledAt: new Date(),
            },
        });

        // Libération de la place
        await this.prisma.trip.update({
            where: { id: order.tripId },
            data: { availableSeats: { increment: 1 } },
        });

        // 💳 Vérifier si une transaction de commission a été prélevée pour cette commande
        const existingTransaction = await this.prisma.transaction.findFirst({
            where: {
                reference: order.id,
                type: TransactionType.COMMISSION,
            },
        });

        // Si oui → rembourser
        if (existingTransaction) {
            const wallet = await this.prisma.wallet.findFirst({
                where: { userId: order.trip.createdById },
            });

            if (wallet) {
                await this.prisma.$transaction([
                    this.prisma.wallet.update({
                        where: { id: wallet.id },
                        data: { balance: { increment: existingTransaction.amount } },
                    }),
                    this.prisma.transaction.create({
                        data: {
                            userId: wallet.userId,
                            walletId: wallet.id,
                            amount: existingTransaction.amount,
                            type: TransactionType.COMMISSION,
                            reference: order.id,
                            description: `Remboursement de la commission suite à l’annulation de la commande ${order.id}`,
                        },
                    }),
                ]);
            }
        }

        // ➕ Notification au conducteur
        this.notificationsGateway.sendToUser(order.trip.driverId, 'order-cancelled', {
            orderId: order.id,
            message: 'Un passager a annulé sa commande.',
        });

        return new BaseResponse(200, 'Commande annulée avec succès', null);
    }

    /** 🏁 Terminer une commande (par le chauffeur) */
    async completeOrder(driverId: string, orderId: string): Promise<BaseResponse<any>> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { trip: true },
        });

        if (!order) throw new NotFoundException('Commande introuvable');

        if (order.trip.driverId !== driverId) {
            throw new ForbiddenException('Vous n\'êtes pas autorisé à terminer cette commande');
        }

        if (order.status !== OrderStatus.VALIDATED) {
            throw new BadRequestException('Seules les commandes validées peuvent être terminées');
        }

        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.COMPLETED,
                completedAt: new Date(),
            },
        });


        // ➕ Notification au client
        this.notificationsGateway.sendToUser(order.userId, 'order-completed', {
            orderId: order.id,
            message: 'Votre trajet est terminé. Merci d’avoir voyagé avec nous !',
        });

        return new BaseResponse(200, 'Commande marquée comme terminée', null);
    }

    /** 📊 Obtenir des statistiques pour un chauffeur */
    async getDriverStats(driverId: string): Promise<BaseResponse<any>> {
        // Récupérer les trajets du chauffeur
        const trips = await this.prisma.trip.findMany({
            where: { driverId },
            select: { id: true },
        });

        const tripIds = trips.map((trip) => trip.id);

        // Compter les commandes par statut
        const [pending, validated, completed] = await Promise.all([
            this.prisma.order.count({
                where: { tripId: { in: tripIds }, status: OrderStatus.PENDING },
            }),
            this.prisma.order.count({
                where: { tripId: { in: tripIds }, status: OrderStatus.VALIDATED },
            }),
            this.prisma.order.count({
                where: { tripId: { in: tripIds }, status: OrderStatus.COMPLETED },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques du chauffeur', {
            pending,
            validated,
            completed,
        });
    }

    /** 📊 Obtenir des statistiques pour un partenaire */
    async getPartnerStats(partnerId: string): Promise<BaseResponse<any>> {
        // Récupérer les chauffeurs du partenaire
        const drivers = await this.prisma.user.findMany({
            where: { partnerId },
            select: { id: true },
        });

        const driverIds = drivers.map((driver) => driver.id);

        // Récupérer les trajets des chauffeurs
        const trips = await this.prisma.trip.findMany({
            where: { driverId: { in: driverIds } },
            select: { id: true },
        });

        const tripIds = trips.map((trip) => trip.id);

        // Compter les commandes par statut
        const [pending, validated, completed] = await Promise.all([
            this.prisma.order.count({
                where: { tripId: { in: tripIds }, status: OrderStatus.PENDING },
            }),
            this.prisma.order.count({
                where: { tripId: { in: tripIds }, status: OrderStatus.VALIDATED },
            }),
            this.prisma.order.count({
                where: { tripId: { in: tripIds }, status: OrderStatus.COMPLETED },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques du partenaire', {
            pending,
            validated,
            completed,
        });
    }

    // 📦 Récupérer toutes les commandes d’un utilisateur
    async getAllOrdersByUser(userId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: { userId },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Toutes les commandes de l’utilisateur', orders);
    }

    // 📅 Commandes du jour d’un utilisateur
    async getTodayOrdersByUser(userId: string): Promise<BaseResponse<any[]>> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const orders = await this.prisma.order.findMany({
            where: {
                userId,
                createdAt: { gte: today },
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes du jour de l’utilisateur', orders);
    }

    // ❌ Commandes annulées d’un utilisateur
    async getCanceledOrdersByUser(userId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                userId,
                status: 'CANCELLED',
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes annulées de l’utilisateur', orders);
    }

    // ✅ Commandes validées d’un utilisateur
    async getValidatedOrdersByUser(userId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                userId,
                status: 'VALIDATED',
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes validées de l’utilisateur', orders);
    }

    // 👨‍✈️ Toutes les commandes d’un chauffeur (driver)
    async getAllOrdersByDriver(driverId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    driverId,
                },
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Toutes les commandes du chauffeur', orders);
    }

    async getTodayOrdersByDriver(driverId: string): Promise<BaseResponse<any[]>> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    driverId,
                },
                createdAt: { gte: today },
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes du jour du chauffeur', orders);
    }

    async getCanceledOrdersByDriver(driverId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    driverId,
                },
                status: 'CANCELLED',
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes annulées du chauffeur', orders);
    }

    async getValidatedOrdersByDriver(driverId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    driverId,
                },
                status: 'VALIDATED',
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes validées du chauffeur', orders);
    }

    // 🤝 Toutes les commandes d’un partenaire
    async getAllOrdersByPartner(partnerId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    vehicle: {
                        partnerId,
                    },
                },
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Toutes les commandes du partenaire', orders);
    }

    async getTodayOrdersByPartner(partnerId: string): Promise<BaseResponse<any[]>> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    vehicle: {
                        partnerId,
                    },
                },
                createdAt: { gte: today },
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes du jour du partenaire', orders);
    }

    async getCanceledOrdersByPartner(partnerId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    vehicle: {
                        partnerId,
                    },
                },
                status: 'CANCELLED',
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes annulées du partenaire', orders);
    }

    async getValidatedOrdersByPartner(partnerId: string): Promise<BaseResponse<any[]>> {
        const orders = await this.prisma.order.findMany({
            where: {
                trip: {
                    vehicle: {
                        partnerId,
                    },
                },
                status: 'VALIDATED',
            },
            include: { trip: true },
        });
        return new BaseResponse(200, 'Commandes validées du partenaire', orders);
    }

    /** 📊 Statistiques globales des commandes (admin/dashboard) */
    async getGlobalOrderStats(): Promise<BaseResponse<any>> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [total, todayCount, cancelled, completed, validated, pending] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { createdAt: { gte: today } } }),
            this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
            this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
            this.prisma.order.count({ where: { status: OrderStatus.VALIDATED } }),
            this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        ]);

        return new BaseResponse(200, 'Statistiques globales des commandes', {
            total,
            todayCount,
            cancelled,
            completed,
            validated,
            pending,
        });
    }




}



