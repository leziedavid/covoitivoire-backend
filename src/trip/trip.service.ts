import {Injectable,NotFoundException,InternalServerErrorException,BadRequestException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTripDto, UpdateTripDto } from 'src/dto/request/trip.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { TripStatus } from '@prisma/client';
import { SearchTripDto } from 'src/dto/request/search-trip.dto';
import { FunctionService } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

@Injectable()
export class TripService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,
    ) {}

    /** 🚗 Création d’un trajet */
    async createTrip(dto: CreateTripDto): Promise<BaseResponse<{ tripId: string }>> {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: dto.vehicleId },
            include: { drivers: true },
        });

        if (!vehicle) throw new NotFoundException('Véhicule introuvable');
        if (!vehicle.drivers || vehicle.drivers.length === 0) {
            throw new BadRequestException('Aucun conducteur assigné à ce véhicule');
        }

        try {
            const { stopPoints, ...tripData } = dto;

            const trip = await this.prisma.trip.create({
                data: {
                    ...tripData,
                    departureLatitude: dto.departureLatitude,
                    departureLongitude: dto.departureLongitude,
                    arrivalLatitude: dto.arrivalLatitude,
                    arrivalLongitude: dto.arrivalLongitude,
                    status: TripStatus.PENDING,
                },
            });

            if (stopPoints?.length > 0) {
                for (const point of stopPoints) {
                    await this.prisma.stopPoint.create({
                        data: {
                            ...point,
                            tripId: trip.id,
                        },
                    });
                }
            }

            return new BaseResponse(201, 'Trajet créé avec succès', { tripId: trip.id });
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException('Erreur lors de la création du trajet');
        }
    }

    /** 🔍 Récupérer un trajet par ID */
    async getTripById(id: string): Promise<BaseResponse<any>> {
        const trip = await this.prisma.trip.findUnique({
            where: { id },
            include: {
                vehicle: true,
                stopPoints: true,
                orders: true,
            },
        });

        if (!trip) throw new NotFoundException('Trajet introuvable');
        return new BaseResponse(200, 'Détails du trajet', trip);
    }

    /** ✏️ Mise à jour d’un trajet */
    async updateTrip(id: string, dto: UpdateTripDto): Promise<BaseResponse<null>> {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) throw new NotFoundException('Trajet introuvable');

        try {
            const { stopPoints, ...tripData } = dto; // ⛔ on retire manuellement stopPoints

            await this.prisma.trip.update({
                where: { id },
                data: {
                    ...tripData,
                    departureLatitude: dto.departureLatitude,
                    departureLongitude: dto.departureLongitude,
                    arrivalLatitude: dto.arrivalLatitude,
                    arrivalLongitude: dto.arrivalLongitude,
                },
            });

            // Mise à jour des stopPoints si fournis
            if (stopPoints && stopPoints.length > 0) {
                // On peut décider de les supprimer et recréer, ou les mettre à jour individuellement
                await this.prisma.stopPoint.deleteMany({ where: { tripId: id } });

                for (const point of stopPoints) {
                    await this.prisma.stopPoint.create({
                        data: {
                            ...point,
                            tripId: id,
                        },
                    });
                }
            }

            return new BaseResponse(200, 'Trajet mis à jour', null);
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du trajet');
        }
    }


    /** ❌ Suppression d’un trajet */
    async deleteTrip(id: string): Promise<BaseResponse<null>> {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) throw new NotFoundException('Trajet introuvable');

        try {
            await this.prisma.stopPoint.deleteMany({ where: { tripId: id } });
            await this.prisma.trip.delete({ where: { id } });

            return new BaseResponse(200, 'Trajet supprimé avec succès', null);
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException('Erreur lors de la suppression du trajet');
        }
    }

    /** 📋 Liste des trajetsX */
    async getAllTripsX(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'Trip',
            page: Number(page),
            limit: Number(limit),
            conditions: {},
            selectAndInclude: {
                select: null,
                include: {
                    vehicle: true,
                    stopPoints: true,
                    orders: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des trajets', data);
    }

    /** 📋 Liste des trajets */
    async getAllTrips(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'Trip',
            page: Number(page),
            limit: Number(limit),
            conditions: {},
            selectAndInclude: {
                select: null,
                include: {
                    vehicle: true,
                    stopPoints: true,
                    orders: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des trajets', data);
    }

    /** 🚘 Liste des trajets d’un véhicule */
    async getTripsByVehicle(vehicleId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'Trip',
            page: Number(page),
            limit: Number(limit),
            conditions: { vehicleId },
            selectAndInclude: {
                select: null,
                include: {
                    stopPoints: true,
                    orders: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des trajets pour ce véhicule', data);
    }

    /** 👨‍✈️ Liste des trajets d’un utilisateur (créateur du trajet) */
    async getTripsByDriver(driverId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'Trip',
            page: Number(page),
            limit: Number(limit),
            conditions: { driverId },
            selectAndInclude: {
                select: null,
                include: {
                    vehicle: true,
                    stopPoints: true,
                    orders: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des trajets du conducteur', data);
    }

    async updateTripStatus(tripId: string, newStatus: TripStatus): Promise<BaseResponse<any>> {
        try {
            // 1. Vérifier l'existence du trajet
            const trip = await this.prisma.trip.findUnique({
                where: { id: tripId },
            });

            if (!trip) {
                throw new NotFoundException('Trajet introuvable');
            }

            // 2. Si le trajet est terminé, on refuse toute modification
            if (trip.status === TripStatus.COMPLETED) {
                throw new BadRequestException('Le trajet est terminé. Aucune modification possible.');
            }

            // 3. Cas spécifique : relancer un trajet annulé
            if (trip.status === TripStatus.CANCELLED && newStatus !== TripStatus.STARTED) {
                throw new BadRequestException("Seule la reprise du trajet (STARTED) est autorisée depuis ANNULÉ.");
            }

            // 4. Cas spécifique : démarrer un trajet depuis PENDING ou CANCELLED
            if (
                (trip.status === TripStatus.PENDING || trip.status === TripStatus.CANCELLED) &&
                newStatus === TripStatus.STARTED
            ) {
                const updated = await this.prisma.trip.update({
                    where: { id: tripId },
                    data: { status: newStatus },
                });

                return new BaseResponse(200, 'Statut du trajet mis à jour avec succès', updated);
            }

            // 5. Autres transitions possibles (facultatif - ici, on autorise tout sauf le cas bloqué ci-dessus)
            const updated = await this.prisma.trip.update({
                where: { id: tripId },
                data: { status: newStatus },
            });

            return new BaseResponse(200, 'Statut du trajet mis à jour avec succès', updated);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la mise à jour du statut du trajet');
        }
    }



    async searchTrips(dto: SearchTripDto & PaginationParamsDto): Promise<any> {
        const {
            departureLatitude,
            departureLongitude,
            arrivalLatitude,
            arrivalLongitude,
            departureDate,
            departureTime,
            arrivalDate,
            arrivalTime,
            availableSeats = 1,
            page = 1,
            limit = 10,
        } = dto;

        try {
            // Étape 1 : Recherche stricte
            const strictTrips = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats },
                    ...(departureDate && { date: new Date(departureDate) }),
                    ...(departureTime && { departureTime }),
                    ...(arrivalDate && { estimatedArrival: new Date(arrivalDate) }),
                    ...(arrivalTime && { arrivalTime }),
                },
                include: {
                    driver: true,
                    vehicle: true,
                    stopPoints: true,
                },
            });

            if (strictTrips.length > 0) {
                const data = this.formatPaginatedResult(strictTrips, page, limit);
                return new BaseResponse(200, 'Trajets directs trouvés', data);
            }

            // Étape 2 : StopPoints
            const tripsWithStops = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats },
                    ...(departureDate && { date: new Date(departureDate) }),
                    ...(departureTime && { departureTime }),
                    ...(arrivalDate && { estimatedArrival: new Date(arrivalDate) }),
                    ...(arrivalTime && { arrivalTime }),
                    stopPoints: {
                        some: {
                            OR: [
                                { latitude: departureLatitude, longitude: departureLongitude },
                                { latitude: arrivalLatitude, longitude: arrivalLongitude },
                            ],
                        },
                    },
                },
                include: {
                    driver: true,
                    vehicle: true,
                    stopPoints: true,
                },
            });

            if (tripsWithStops.length > 0) {
                const data = this.formatPaginatedResult(tripsWithStops, page, limit);
                return new BaseResponse(200, 'Trajets trouvés via des points d’arrêt', data);
            }

            // Étape 3 : Recherche par distance
            const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                const R = 6371;
                const toRad = (val: number) => (val * Math.PI) / 180;
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const allTrips = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats },
                },
                include: {
                    driver: true,
                    vehicle: true,
                    stopPoints: true,
                },
            });

            const nearbyTrips = allTrips.filter((trip) => {
                if (
                    trip.departureLatitude === null || trip.departureLongitude === null ||
                    trip.arrivalLatitude === null || trip.arrivalLongitude === null
                ) return false;

                const departureDist = getDistanceInKm(departureLatitude, departureLongitude, trip.departureLatitude, trip.departureLongitude);
                const arrivalDist = getDistanceInKm(arrivalLatitude, arrivalLongitude, trip.arrivalLatitude, trip.arrivalLongitude);

                return departureDist <= 30 && arrivalDist <= 30;
            });

            if (nearbyTrips.length > 0) {
                const data = this.formatPaginatedResult(nearbyTrips, page, limit);
                return new BaseResponse(200, 'Trajets proches trouvés', data);
            }

            return new BaseResponse(200, 'Aucun trajet trouvé', {
                status: false,
                total: 0,
                page,
                limit,
                data: [],
            });

        } catch (error) {
            return new BaseResponse(500, error.message || 'Erreur interne du serveur', {
                status: false,
                total: 0,
                page,
                limit,
                data: [],
            });
        }
    }

    private formatPaginatedResult(data: any[], page: number, limit: number) {
        const total = data.length;
        const start = (page - 1) * limit;
        const paginated = data.slice(start, start + limit);

        return {
            status: true,
            total,
            page,
            limit,
            data: paginated,
        };
    }



    async searchTrips2(dto: SearchTripDto & PaginationParamsDto): Promise<any> {
        const {
            departureLatitude,
            departureLongitude,
            arrivalLatitude,
            arrivalLongitude,
            departureDate,
            departureTime,
            arrivalDate,
            arrivalTime,
            availableSeats = 1,
            page = 1,
            limit = 10,
        } = dto;

        try {
            // Étape 1 : Recherche stricte
            const strictTrips = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats },
                    ...(departureDate && { date: new Date(departureDate) }),
                    ...(departureTime && { departureTime }),
                    ...(arrivalDate && { estimatedArrival: new Date(arrivalDate) }),
                    ...(arrivalTime && { arrivalTime }),
                },
                include: {
                    driver: true,
                    vehicle: true,
                    stopPoints: true,
                },
            });

            if (strictTrips.length > 0) {
                return this.formatPaginatedResult2(strictTrips, page, limit, 'Trajets directs trouvés');
            }

            // Étape 2 : StopPoints
            const tripsWithStops = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats },
                    ...(departureDate && { date: new Date(departureDate) }),
                    ...(departureTime && { departureTime }),
                    ...(arrivalDate && { estimatedArrival: new Date(arrivalDate) }),
                    ...(arrivalTime && { arrivalTime }),
                    stopPoints: {
                        some: {
                            OR: [
                                { latitude: departureLatitude, longitude: departureLongitude },
                                { latitude: arrivalLatitude, longitude: arrivalLongitude },
                            ],
                        },
                    },
                },
                include: {
                    driver: true,
                    vehicle: true,
                    stopPoints: true,
                },
            });

            if (tripsWithStops.length > 0) {
                return this.formatPaginatedResult2(tripsWithStops, page, limit, 'Trajets trouvés via des points d’arrêt');
            }

            // Étape 3 : Recherche par distance (Haversine)
            const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                const R = 6371;
                const toRad = (val: number) => (val * Math.PI) / 180;
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const allTrips = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats },
                },
                include: {
                    driver: true,
                    vehicle: true,
                    stopPoints: true,
                },
            });

            const nearbyTrips = allTrips.filter((trip) => {
                if (
                    trip.departureLatitude === null || trip.departureLongitude === null ||
                    trip.arrivalLatitude === null || trip.arrivalLongitude === null
                ) {
                    return false;
                }

                const departureDist = getDistanceInKm(departureLatitude, departureLongitude, trip.departureLatitude, trip.departureLongitude);
                const arrivalDist = getDistanceInKm(arrivalLatitude, arrivalLongitude, trip.arrivalLatitude, trip.arrivalLongitude);

                return departureDist <= 30 && arrivalDist <= 30;
            });

            if (nearbyTrips.length > 0) {
                return this.formatPaginatedResult2(nearbyTrips, page, limit, 'Trajets proches trouvés');
            }

            // Aucun résultat trouvé
            return {
                status: false,
                message: 'Aucun trajet trouvé',
                total: 0,
                page,
                limit,
                data: [],
            };
        } catch (error) {
            return {
                status: false,
                message: error.message || 'Erreur interne du serveur',
                total: 0,
                page,
                limit,
                data: [],
            };
        }
    }

    private formatPaginatedResult2(data: any[], page: number, limit: number, message: string) {
        const total = data.length;
        const start = (page - 1) * limit;
        const paginated = data.slice(start, start + limit);

        return {
            status: true,
            message,
            total,
            page,
            limit,
            data: paginated,
        };
    }





}
