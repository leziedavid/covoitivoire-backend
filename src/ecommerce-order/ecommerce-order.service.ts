import {Injectable,NotFoundException,BadRequestException,InternalServerErrorException,ForbiddenException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CreateEcommerceOrderDto } from 'src/dto/request/ecommerce-order.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { startOfMonth, endOfMonth, format } from 'date-fns';


@Injectable()
export class EcommerceOrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,

    ) { }

    private async generateOrderNumber(): Promise<string> {
        const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `CMD-${datePart}-${randomPart}`;
    }

    async createOrder(dto: CreateEcommerceOrderDto, userId: string) {
        const productIds = dto.items.map(i => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
            throw new BadRequestException('Un ou plusieurs produits n’existent pas');
        }

        const calculatedAmount = dto.items.reduce((acc, item) => {
            const prod = products.find(p => p.id === item.productId)!;
            return acc + prod.price * item.quantity;
        }, 0);

        if (Math.abs(calculatedAmount - dto.amount) > 0.01) {
            throw new BadRequestException('Montant total invalide');
        }

        const orderNumber = await this.generateOrderNumber();

        try {
            const order = await this.prisma.ecommerceOrder.create({
                data: {
                    ordersNumber: orderNumber,
                    userId,
                    paymentMethod: dto.paymentMethod,
                    deliveryMethod: dto.deliveryMethod,
                    amount: dto.amount,
                    status: OrderStatus.PENDING,
                    addedById: userId,
                    items: {
                        create: dto.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
                include: { items: true },
            });

            return new BaseResponse(201, 'Commande créée avec succès', order);
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la création de la commande');
        }
    }

    async getOrderById(id: string) {
        const order = await this.prisma.ecommerceOrder.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                user: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        return new BaseResponse(200, 'Commande récupérée avec succès', order);
    }

    async deleteOrder(orderId: string, userId: string) {
        const order = await this.prisma.ecommerceOrder.findUnique({ where: { id: orderId } });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        if (order.userId !== userId) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cette commande");
        }

        await this.prisma.ecommerceOrderItem.deleteMany({
            where: { ecommerceOrderId: orderId },
        });

        await this.prisma.ecommerceOrder.delete({
            where: { id: orderId },
        });

        return new BaseResponse(200, 'Commande supprimée avec succès', '');
    }

    async updateOrderStatus(orderId: string, newStatus: OrderStatus, userId: string): Promise<BaseResponse<any>> {
        const order = await this.prisma.ecommerceOrder.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: { product: true },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Impossible de modifier une commande annulée');
        }

        // Vérifie que l'utilisateur est le créateur d'au moins un produit de la commande
        const isCreator = order.items.some(item => item.product.addedById === userId);

        if (!isCreator) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette commande");
        }

        const updated = await this.prisma.ecommerceOrder.update({
            where: { id: orderId },
            data: { status: newStatus },
            include: {
                items: { include: { product: true } },
                user: true,
            },
        });

        return new BaseResponse(200, 'Statut mis à jour avec succès', updated);
    }

    async cancelOrder(orderId: string, userId: string) {
        const order = await this.prisma.ecommerceOrder.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        if (order.userId !== userId) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à annuler cette commande");
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Commande déjà annulée');
        }

        const updated = await this.prisma.ecommerceOrder.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.CANCELLED,
                canceledAt: new Date(),
            },
            include: {
                items: true,
            },
        });

        return new BaseResponse(200, 'Commande annulée avec succès', updated);
    }


    async getAllOrders(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    user: true,
                    items: {
                        include: { product: true },
                    },
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);
        return new BaseResponse(200, 'Liste paginée des commandes', data);
    }

    async getOrdersByUserId(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            conditions: { userId },
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    items: { include: { product: true } },
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);
        return new BaseResponse(200, 'Commandes utilisateur paginées', data);
    }

    async getOrdersByProductCreator(creatorId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            conditions: {
                items: {
                    some: {
                        product: {
                            addedById: creatorId,
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    user: true,
                    items: {
                        include: { product: true },
                    },
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);
        return new BaseResponse(200, 'Commandes liées aux produits créés', data);
    }

    async getOrderStatsAndGains(): Promise<BaseResponse<any>> {
        // Comptages globaux
        const [
            totalOrders,
            totalOrdersCancelled,
            totalOrdersValidated,
            totalOrdersCompleted,
            totalRevenueAggregate,
        ] = await Promise.all([
            // total commandes
            this.prisma.ecommerceOrder.count(),

            // total commandes annulées
            this.prisma.ecommerceOrder.count({
                where: { status: OrderStatus.CANCELLED },
            }),

            // total commandes validées (VALIDATED)
            this.prisma.ecommerceOrder.count({
                where: { status: OrderStatus.VALIDATED },
            }),

            // total commandes terminées (COMPLETED)
            this.prisma.ecommerceOrder.count({
                where: { status: OrderStatus.COMPLETED },
            }),

            // somme des montants (gains) sur toutes les commandes (par exemple status COMPLETED)
            this.prisma.ecommerceOrder.aggregate({
                where: { status: OrderStatus.COMPLETED },
                _sum: { amount: true },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques globales des commandes', {
            totalOrders,
            totalOrdersCancelled,
            totalOrdersValidated,
            totalOrdersCompleted,
            totalGains: totalRevenueAggregate._sum.amount || 0,
        });
    }

    async getOrdersAndRevenueStats(
        startDate?: Date,
        endDate?: Date,
    ): Promise<BaseResponse<any>> {
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(end.getMonth() - 11));

        // Construction de la liste des mois entre start et end, format yyyy-MM
        const months: string[] = [];
        const current = new Date(start);
        while (current <= end) {
            months.push(format(current, 'yyyy-MM'));
            current.setMonth(current.getMonth() + 1);
        }
        
        // Récupération des commandes "COMPLETED" dans la plage
        const orders = await this.prisma.ecommerceOrder.findMany({
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startOfMonth(start),
                    lte: endOfMonth(end),
                },
            },
            select: {
                amount: true,
                createdAt: true,
            },
        });

        // Regroupement des commandes par mois (yyyy-MM) avec total montant et compte
        const grouped = new Map<string, { orders: number; revenue: number }>();
        for (const order of orders) {
            const key = format(order.createdAt, 'yyyy-MM');
            if (!grouped.has(key)) {
                grouped.set(key, { orders: 0, revenue: 0 });
            }
            const current = grouped.get(key)!;
            current.orders += 1;
            current.revenue += order.amount ?? 0;
        }

        // Organisation des données dans l'ordre chronologique (janvier → décembre)
        const merged = months.map(label => ({
            label,
            monthNumber: parseInt(label.split('-')[1], 10), // extrait le mois
            orders: grouped.get(label)?.orders ?? 0,
            revenue: grouped.get(label)?.revenue ?? 0,
        }));

        merged.sort((a, b) => a.monthNumber - b.monthNumber);

        // Extraction des données à retourner
        const labels = merged.map(item => item.label);
        const ordersData = merged.map(item => item.orders);
        const revenueData = merged.map(item => item.revenue);

        return new BaseResponse(200, 'Statistiques commandes et revenus par mois (Janv → Déc)', {
            labels,
            orders: ordersData,
            revenue: revenueData,
        });
    }


}
