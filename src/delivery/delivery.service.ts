import { Injectable, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { DeliveryStatus, ServiceType } from '@prisma/client';
import { CreateDeliveryDto, UpdateDeliveryDto } from 'src/dto/request/delivery.dto';

@Injectable()
export class DeliveryService {
    constructor(private readonly prisma: PrismaService) { }

    /** 📦 Création d'une livraison avec vérification service livraison actif */
    async createDelivery(dto: CreateDeliveryDto, userId: string): Promise<BaseResponse<{ deliveryId: string }>> {
        // Vérifier que l'utilisateur a un service de type DELIVERY actif
        const activeService = await this.prisma.service.findFirst({
            where: {
                id: dto.serviceId,
                type: ServiceType.DELIVERY,
                partnerId: userId,
                subscriptions: {
                    some: {
                        endDate: { gt: new Date() },
                    },
                },
            },
        });
        if (!activeService) {
            throw new ForbiddenException('Service livraison invalide ou abonnement expiré');
        }

        try {
            const delivery = await this.prisma.delivery.create({
                data: {
                    pickupAddress: dto.pickupAddress,
                    pickupLat: dto.pickupLat,
                    pickupLng: dto.pickupLng,
                    dropAddress: dto.dropAddress,
                    dropLat: dto.dropLat,
                    dropLng: dto.dropLng,
                    description: dto.description,
                    scheduledAt: dto.scheduledAt,
                    status: dto.status ?? DeliveryStatus.PENDING,
                    serviceId: dto.serviceId,
                    customerId: dto.customerId,
                    addedById: userId,
                    driverId: dto.driverId,
                    packages: dto.packages
                        ? {
                            create: dto.packages.map(pkg => ({
                                description: pkg.description,
                                weight: pkg.weight,
                                length: pkg.length,
                                width: pkg.width,
                                height: pkg.height,
                            })),
                        }
                        : undefined,
                },
                include: {
                    packages: true,
                    assignments: true,
                },
            });

            return new BaseResponse(201, 'Livraison créée avec succès', { deliveryId: delivery.id });
        } catch (err) {
            throw new InternalServerErrorException('Erreur lors de la création de la livraison');
        }
    }

    /** 🔍 Récupérer une livraison complète par son id */
    async getDeliveryById(id: string): Promise<BaseResponse<any>> {
        const delivery = await this.prisma.delivery.findUnique({
            where: { id },
            include: {
                packages: true,
                assignments: true,
            },
        });
        if (!delivery) throw new NotFoundException('Livraison introuvable');

        return new BaseResponse(200, 'Détails de la livraison', delivery);
    }

    /** ✏️ Mise à jour d'une livraison (hors packages et assignments) */
    async updateDelivery(id: string, dto: UpdateDeliveryDto, userId: string): Promise<BaseResponse<null>> {
        const existing = await this.prisma.delivery.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Livraison introuvable');

        if (existing.addedById !== userId) {
            throw new ForbiddenException('Vous n’êtes pas autorisé à modifier cette livraison');
        }

        // Vérifier si serviceId fourni est valide (si changement)
        if (dto.serviceId && dto.serviceId !== existing.serviceId) {
            const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
            if (!service) throw new NotFoundException('Service introuvable');
        }

        try {
            const { packages, assignments, ...rest } = dto;
            await this.prisma.delivery.update({
                where: { id },
                data: rest,
            });
            return new BaseResponse(200, 'Livraison mise à jour', null);
        } catch (err) {
            throw new InternalServerErrorException('Erreur lors de la mise à jour de la livraison');
        }
    }

    /** ❌ Suppression d'une livraison */
    async deleteDelivery(id: string, userId: string): Promise<BaseResponse<null>> {
        const delivery = await this.prisma.delivery.findUnique({ where: { id } });
        if (!delivery) throw new NotFoundException('Livraison introuvable');

        if (delivery.addedById !== userId) {
            throw new ForbiddenException('Vous n’êtes pas autorisé à supprimer cette livraison');
        }

        try {
            await this.prisma.delivery.delete({ where: { id } });
            return new BaseResponse(200, 'Livraison supprimée', null);
        } catch (err) {
            throw new InternalServerErrorException('Erreur lors de la suppression de la livraison');
        }
    }

    /** 📋 Liste des livraisons d’un service */
    async getDeliveriesByService(serviceId: string): Promise<BaseResponse<any[]>> {
        const now = new Date();

        const deliveries = await this.prisma.delivery.findMany({
            where: {
                serviceId,
                service: {
                    subscriptions: {
                        some: {
                            startDate: { lte: now },
                            endDate: { gte: now },
                        },
                    },
                },
            },
            include: {
                packages: true,
                assignments: true,
            },
            orderBy: { scheduledAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des livraisons du service', deliveries);
    }

    /**
   * 🔄 Met à jour le statut d'une livraison
   * @param id - ID de la livraison
   * @param newStatus - Nouveau statut à appliquer
   * @param userId - ID de l'utilisateur qui fait la modification (pour contrôle d'accès)
   */
    async updateDeliveryStatus( id: string, newStatus: DeliveryStatus, userId: string,): Promise<BaseResponse<{ updatedStatus: DeliveryStatus }>> {

        const delivery = await this.prisma.delivery.findUnique({ where: { id } });
        if (!delivery) throw new NotFoundException('Livraison introuvable');

        // Vérifier que l'utilisateur est autorisé à modifier la livraison
        if (delivery.addedById !== userId && delivery.driverId !== userId) {
            throw new ForbiddenException('Vous n’êtes pas autorisé à modifier le statut de cette livraison');
        }

        // Optionnel: vérifier que le nouveau statut est différent de l'ancien
        if (delivery.status === newStatus) {
            return new BaseResponse(200, 'Le statut est déjà à jour', { updatedStatus: newStatus });
        }

        // Mettre à jour le statut
        try {
            const updatedDelivery = await this.prisma.delivery.update({
                where: { id },
                data: { status: newStatus },
            });

            return new BaseResponse(200, 'Statut de la livraison mis à jour', {
                updatedStatus: updatedDelivery.status,
            });

        } catch (err) {

            throw new InternalServerErrorException('Erreur lors de la mise à jour du statut');
        }

    }

}
