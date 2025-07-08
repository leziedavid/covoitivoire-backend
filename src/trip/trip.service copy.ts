import {Injectable,NotFoundException,InternalServerErrorException,BadRequestException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTripDto, UpdateTripDto } from 'src/dto/request/trip.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { TripStatus } from '@prisma/client';
import { SearchTripDto } from 'src/dto/request/search-trip.dto';
import { FunctionService } from 'src/utils/pagination.service';

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

    /** 📋 Liste des trajets */
    async getAllTrips(): Promise<BaseResponse<any[]>> {
        const trips = await this.prisma.trip.findMany({
            include: {
                vehicle: true,
                stopPoints: true,
                orders: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des trajets', trips);
    }

    /** 🚘 Liste des trajets d’un véhicule */
    async getTripsByVehicle(vehicleId: string): Promise<BaseResponse<any[]>> {
        const trips = await this.prisma.trip.findMany({
            where: { vehicleId },
            include: {
                stopPoints: true,
                orders: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des trajets pour ce véhicule', trips);
    }

    /** 👨‍✈️ Liste des trajets d’un utilisateur (créateur du trajet) */
    async getTripsByDriver(driverId: string): Promise<BaseResponse<any[]>> {
        const trips = await this.prisma.trip.findMany({
            where: { driverId: driverId },
            include: {
                stopPoints: true,
                vehicle: true,
                orders: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des trajets du conducteur', trips);
    }

    async searchTrips(dto: SearchTripDto): Promise<BaseResponse<any[]>> {
        // Extraction des données du DTO
        const {
            departureLatitude,
            departureLongitude,
            arrivalLatitude,
            arrivalLongitude,
            departureDate,
            departureTime,
            arrivalDate,
            arrivalTime,
            availableSeats = 1, // Valeur par défaut : 1 place demandée
        } = dto;

        try {
            // Étape 1 : recherche stricte des trajets selon les filtres
            const trips = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats }, // places dispo

                    // Filtres conditionnels
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

            // Si des trajets sont trouvés strictement, on les retourne
            if (trips.length > 0) {
                return new BaseResponse(200, 'Trajets directs trouvés', trips);
            }

            // Étape 2 : Recherche dans les stopPoints (cas où le trajet passe par un arrêt proche)
            const tripsWithStops = await this.prisma.trip.findMany({
                where: {
                    availableSeats: { gte: availableSeats },

                    // Même logique de filtres si précisé
                    ...(departureDate && { date: new Date(departureDate) }),
                    ...(departureTime && { departureTime }),
                    ...(arrivalDate && { estimatedArrival: new Date(arrivalDate) }),
                    ...(arrivalTime && { arrivalTime }),
                    stopPoints: {
                        some: {
                            OR: [
                                {
                                    latitude: departureLatitude,
                                    longitude: departureLongitude,
                                },
                                {
                                    latitude: arrivalLatitude,
                                    longitude: arrivalLongitude,
                                },
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
                return new BaseResponse(200, 'Trajets trouvés via des points d’arrêt', tripsWithStops);
            }

            // Étape 3 : Dernier recours — recherche de trajets "proches" en coordonnées
            // Fonction Haversine pour distance en km
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

            // Recherche large (tous trajets à date ou sans date)
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

            // Filtrage manuel selon distance entre coordonnées (on accepte < 30 km)
            const nearbyTrips = allTrips.filter((trip) => {
                if (
                    trip.departureLatitude === null ||
                    trip.departureLongitude === null ||
                    trip.arrivalLatitude === null ||
                    trip.arrivalLongitude === null
                ) {
                    return false;
                }

                const departureDist = getDistanceInKm(
                    departureLatitude,
                    departureLongitude,
                    trip.departureLatitude,
                    trip.departureLongitude,
                );

                const arrivalDist = getDistanceInKm(
                    arrivalLatitude,
                    arrivalLongitude,
                    trip.arrivalLatitude,
                    trip.arrivalLongitude,
                );

                // Si les deux extrémités sont dans un rayon de 30 km
                return departureDist <= 30 && arrivalDist <= 30;
            });

            if (nearbyTrips.length > 0) {
                return new BaseResponse(200, 'Trajets proches trouvés', nearbyTrips);
            }

            // Si aucune des étapes n’a abouti
            return new BaseResponse(404, 'Aucun trajet trouvé', []);
        } catch (error) {
            // Gestion d’erreur propre
            return new BaseResponse(500, error.message || 'Erreur interne du serveur', []);
        }
    }

}
