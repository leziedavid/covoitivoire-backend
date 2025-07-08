import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatsFilterDto } from 'src/dto/request/stats-filter.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { startOfWeek, endOfWeek } from 'date-fns';
import {
    PaymentMethod,
    TransactionType,
    OrderStatus,
    TripStatus,
} from '@prisma/client';

@Injectable()
export class StatisticsService {
    constructor(private readonly prisma: PrismaService) { }

    private resolvePeriod(dto: StatsFilterDto): { dateDebut: Date; dateFin: Date } {
        const now = new Date();
        const dateDebut = dto.dateDebut ?? startOfWeek(now, { weekStartsOn: 1 });
        const dateFin = dto.dateFin ?? endOfWeek(now, { weekStartsOn: 1 });
        return { dateDebut, dateFin };
    }

    async getAdminStatistics(dto: StatsFilterDto): Promise<BaseResponse<any>> {
        return this.getStatistics(null, dto);
    }

    async getUserStatistics(userId: string, dto: StatsFilterDto): Promise<BaseResponse<any>> {
        return this.getStatistics(userId, dto);
    }

    private async getStatistics( userId: string | null, dto: StatsFilterDto): Promise<BaseResponse<any>> {
        try {
            const { dateDebut, dateFin } = this.resolvePeriod(dto);

            const wallet = userId ? await this.prisma.wallet.findFirst({ where: { userId } }): null;

            const [orders, trips, transactions, totalUsers, totalServices, totalProducts] = await Promise.all([
                this.prisma.order.findMany({
                    where: { ...(userId && { userId }),createdAt: { gte: dateDebut, lte: dateFin },},
                }),
                this.prisma.trip.findMany({
                    where: {
                        ...(userId && { createdById: userId }),
                        createdAt: { gte: dateDebut, lte: dateFin },
                    },
                }),
                this.prisma.transaction.findMany({
                    where: {
                        ...(userId && { userId }),
                        createdAt: { gte: dateDebut, lte: dateFin },
                    },
                }),
                this.prisma.user.count(),
                this.prisma.service.count(),
                this.prisma.product.count(),
            ]);

            const formattedWallet = wallet
                ? {
                    id: wallet.id,
                    balance: wallet.balance,
                    userId: wallet.userId,
                    paymentMethod: wallet.paymentMethod ?? PaymentMethod.MOBILE_MONEY,
                    rechargeType: wallet.rechargeType ?? 'WAVE',
                    createdAt: wallet.createdAt,
                    updatedAt: wallet.updatedAt,
                    transactions: [],
                }
                : null;

            const formattedTransactions = transactions.map((t) => ({
                id: t.id,
                amount: t.amount,
                type: t.type,
                walletId: t.walletId,
                userId: t.userId,
                reference: t.reference,
                description: t.description,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            }));

            const formattedOrders = orders.map((o) => ({
                id: o.id,
                userId: o.userId,
                tripId: o.tripId,
                status: o.status as OrderStatus,
                paymentMethod: o.paymentMethod,
                amount: o.amount,
                canceledAt: o.canceledAt,
                createdAt: o.createdAt,
                completedAt: o.completedAt,
                updatedAt: o.updatedAt,
            }));

            const formattedTrips = trips.map((t) => ({
                id: t.id,
                createdById: t.createdById,
                driverId: t.driverId,
                vehicleId: t.vehicleId,
                departure: t.departure,
                departureLatitude: t.departureLatitude,
                departureLongitude: t.departureLongitude,
                arrival: t.arrival,
                arrivalLatitude: t.arrivalLatitude,
                arrivalLongitude: t.arrivalLongitude,
                date: t.date,
                departureTime: t.departureTime,
                arrivalTime: t.arrivalTime,
                estimatedArrival: t.estimatedArrival,
                availableSeats: t.availableSeats,
                distance: t.distance,
                price: t.price,
                description: t.description,
                instructions: t.instructions,
                status: t.status as TripStatus,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            }));

            const commissionAmount = formattedTransactions.filter((t) => t.type === TransactionType.COMMISSION).reduce((acc, t) => acc + (t.amount ?? 0), 0);

            const totalOrderAmount = formattedOrders.reduce( (acc, order) => acc + (order.amount ?? 0),0 );

            // Cards dashboard

            const cards = userId
                ? [
                    {
                        title: 'Mon solde',
                        count: formattedWallet?.balance ?? 0,
                        icon: 'Wallet',
                        iconColor: 'text-green-600',
                        bgColor: 'bg-green-100',
                    },
                    {
                        title: 'Mes commandes',
                        count: formattedOrders.length,
                        icon: 'ShoppingCart',
                        iconColor: 'text-purple-600',
                        bgColor: 'bg-purple-100',
                    },
                    {
                        title: 'Montant total des commandes',
                        count: totalOrderAmount,
                        icon: 'DollarSign',
                        iconColor: 'text-yellow-600',
                        bgColor: 'bg-yellow-100',
                    },
                    {
                        title: 'Mes trajets',
                        count: formattedTrips.length,
                        icon: 'Map',
                        iconColor: 'text-blue-600',
                        bgColor: 'bg-blue-100',
                    },
                    {
                        title: 'Mes transactions',
                        count: formattedTransactions.length,
                        icon: 'CreditCard',
                        iconColor: 'text-orange-600',
                        bgColor: 'bg-orange-100',
                    },
                ]
                : [
                    {
                        title: 'Utilisateurs',
                        count: totalUsers,
                        icon: 'Users',
                        iconColor: 'text-green-600',
                        bgColor: 'bg-green-100',
                    },
                    {
                        title: 'Commandes',
                        count: formattedOrders.length,
                        icon: 'ShoppingCart',
                        iconColor: 'text-purple-600',
                        bgColor: 'bg-purple-100',
                    },
                    {
                        title: 'Commissions (XOF)',
                        count: commissionAmount,
                        icon: 'DollarSign',
                        iconColor: 'text-yellow-600',
                        bgColor: 'bg-yellow-100',
                    },
                    {
                        title: 'Trajets',
                        count: formattedTrips.length,
                        icon: 'MapPin',
                        iconColor: 'text-blue-600',
                        bgColor: 'bg-blue-100',
                    },
                    {
                        title: 'Transactions',
                        count: formattedTransactions.length,
                        icon: 'CreditCard',
                        iconColor: 'text-orange-600',
                        bgColor: 'bg-orange-100',
                    },
                    {
                        title: 'Services actifs',
                        count: totalServices,
                        icon: 'Server',
                        iconColor: 'text-teal-600',
                        bgColor: 'bg-teal-100',
                    },
                    {
                        title: 'Produits',
                        count: totalProducts,
                        icon: 'Package',
                        iconColor: 'text-pink-600',
                        bgColor: 'bg-pink-100',
                    },
                ];

            return new BaseResponse(200, 'Statistiques récupérées', {
                wallet: formattedWallet,
                transactions: formattedTransactions,
                orders: formattedOrders,
                trips: formattedTrips,
                commissionRevenue: commissionAmount,
                dateDebut,
                dateFin,
                cards,
            });

        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la récupération des statistiques');
        }
    }
}
