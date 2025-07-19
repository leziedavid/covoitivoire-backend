import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CreateEcommerceOrderDto } from 'src/dto/request/ecommerce-order.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';

@Injectable()
export class EcommerceOrderService {
    constructor(private readonly prisma: PrismaService) { }

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

    async getAllOrders() {
        const orders = await this.prisma.ecommerceOrder.findMany({
            include: {
                items: { include: { product: true } },
                user: true,
            },
        });

        return new BaseResponse(200, 'Liste des commandes récupérée avec succès', orders);
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

    async getOrdersByUserId(userId: string) {
        const orders = await this.prisma.ecommerceOrder.findMany({
            where: { userId },
            include: {
                items: { include: { product: true } },
            },
        });

        return new BaseResponse(200, 'Commandes de l’utilisateur récupérées avec succès', orders);
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

    async getOrdersByProductCreator(creatorId: string) {
        const orders = await this.prisma.ecommerceOrder.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            addedById: creatorId,
                        },
                    },
                },
            },
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return new BaseResponse(200, 'Commandes liées aux produits du créateur récupérées avec succès', orders);
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


}
