import { Injectable,NotFoundException,InternalServerErrorException,BadRequestException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VehicleType } from '@prisma/client';
import { CreateVehicleDto, UpdateVehicleDto } from 'src/dto/request/vehicle.dto';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService } from 'src/utils/pagination.service';

@Injectable()
export class VehicleService {
    constructor( 
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
    ) { }

    /** 🚗 Création d’un nouveau véhicule */
    async createVehicle(dto: CreateVehicleDto): Promise<BaseResponse<{ vehicleId: string }>> {
        // Validation du type de véhicule
        if (!Object.values(VehicleType).includes(dto.type as VehicleType)) {
            throw new BadRequestException('Type de véhicule invalide');
        }

        // Extraire file avant de créer le véhicule
        const { file, ...vehicleData } = dto;

        // Création du véhicule
        const vehicle = await this.prisma.vehicle.create({
            data: {
                ...vehicleData,
                type: dto.type as VehicleType,
            },
        });

        console.log(file);
        // Upload des fichiers associés au véhicule, s’ils existent
        if (file) {
            try {
                const upload = await this.cloudinary.uploadFile(file.buffer, 'vehicles');
                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'vehicleFiles',
                        targetId: vehicle.id,
                    },
                });

            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload des documents du véhicule');
            }
        }

        return new BaseResponse(201, 'Véhicule créé avec succès', { vehicleId: vehicle.id });
    }

    /** 🔍 Récupérer les détails d’un véhicule */
    async getVehicleById(id: string): Promise<BaseResponse<any>> {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                partner: true,
                drivers: true,
                trips: true,
            },
        });
        if (!vehicle) throw new NotFoundException('Véhicule introuvable');

        // Récupération des fichiers liés au véhicule
        const files = await this.prisma.fileManager.findMany({
            where: { fileType: 'vehicleFiles', targetId: id },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Détails du véhicule', { ...vehicle, files });
    }

    /** ✏️ Mise à jour d’un véhicule */
    async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<BaseResponse<null>> {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) throw new NotFoundException('Véhicule introuvable');

        // Extraire file avant la mise à jour
        const { file, ...vehicleData } = dto;

        // Mise à jour des informations du véhicule (sans file)
        await this.prisma.vehicle.update({
            where: { id },
            data: vehicleData,
        });

        // Upload de nouveaux fichiers si fournis
        if (file) {
            try {

                const upload = await this.cloudinary.uploadFile(file.buffer, 'vehicles');
                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'vehicleFiles',
                        targetId: id,
                    },
                });

            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’ajout de fichiers');
            }
        }

        return new BaseResponse(200, 'Véhicule mis à jour', null);
    }

    /** ❌ Suppression d’un véhicule ainsi que de ses fichiers associés */
    async deleteVehicle(id: string): Promise<BaseResponse<null>> {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) throw new NotFoundException('Véhicule introuvable');

        // Récupération des fichiers liés au véhicule
        const files = await this.prisma.fileManager.findMany({
            where: { fileType: 'vehicleFiles', targetId: id },
        });

        // Suppression des fichiers sur Cloudinary
        for (const file of files) {
            try {
                await this.cloudinary.deleteFileByPublicId(file.fileCode);
            } catch (err) {
                console.warn(`Erreur suppression fichier Cloudinary: ${file.fileCode}`);
            }
        }

        // Suppression des références fichiers dans la base
        if (files.length) {
            await this.prisma.fileManager.deleteMany({
                where: { fileType: 'vehicleFiles', targetId: id },
            });
        }

        // Suppression du véhicule
        await this.prisma.vehicle.delete({ where: { id } });

        return new BaseResponse(200, 'Véhicule supprimé', null);
    }

    /** 🚙 Liste des véhicules d’un partenaire, avec leurs fichiers */
    async getVehiclesByPartner(partnerId: string): Promise<BaseResponse<any[]>> {
        const vehicles = await this.prisma.vehicle.findMany({
            where: { partnerId },
            orderBy: { createdAt: 'desc' },
        });

        // Récupération des fichiers pour chaque véhicule
        const vehiclesWithFiles = await Promise.all(

            vehicles.map(async (vehicle) => {
                const files = await this.prisma.fileManager.findMany({
                    where: { fileType: 'vehicleFiles', targetId: vehicle.id },
                    orderBy: { createdAt: 'desc' },
                });
                return { ...vehicle, files };
            }),
        );

        return new BaseResponse(200, 'Liste des véhicules du partenaire', vehiclesWithFiles);
    }

    async getAllVehiclesByPartner(partnerId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const data = await this.functionService.paginate({
            model: 'Vehicle',
            page: Number(page),
            limit: Number(limit),
            conditions: { partnerId },
            selectAndInclude: {
                select: null,
                include: {
                    partner: true,
                    drivers: true,
                },
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['vehicleFiles'],
        });

        console
        // Remplacement drivers par leur infos utilisateurs
        data.data = await Promise.all(
            data.data.map(async (vehicle) => {
                const driverInfos = vehicle.drivers.length ? await this.prisma.user.findMany({ where: { id: { in: vehicle.drivers.map((d) => d.id) } }, }) : [];
                return {
                    ...vehicle,
                    drivers: driverInfos,
                };
            }),
        );

        return new BaseResponse(200, 'Liste des véhicules du partenaire', data);
    }

    async getAllVehicles(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const data = await this.functionService.paginate({
            model: 'Vehicle',
            page: Number(page),
            limit: Number(limit),
            conditions: {},
            selectAndInclude: {
                select: null,
                include: {
                    partner: true,
                    drivers: true,
                },
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['vehicleFiles'],
        });

        data.data = await Promise.all(
            data.data.map(async (vehicle) => {
                const driverInfos = vehicle.drivers.length ? await this.prisma.user.findMany({ where: { id: { in: vehicle.drivers.map((d) => d.id) } }, }) : [];
                return {
                    ...vehicle,
                    drivers: driverInfos,
                };
            }),
        );

        return new BaseResponse(200, 'Liste de tous les véhicules', data);
    }

    /** 🚗 Liste des véhicules d’un partenaire avec conducteurs et images */
    async getVehiclesWithDrivers2(partnerId: string): Promise<BaseResponse<any[]>> {
        const vehicles = await this.prisma.vehicle.findMany({
            where: { partnerId }, // ✅ filtre sur le partenaire
            orderBy: { createdAt: 'desc' },
            include: {
                drivers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                        phoneNumber: true,
                        createdAt: true,

                    },
                },
            },
        });

        const enrichedVehicles = await Promise.all(
            vehicles.map(async (vehicle) => {
                const driversWithImages = await Promise.all(
                    vehicle.drivers.map(async (user) => {
                        const file = await this.prisma.fileManager.findFirst({
                            where: {
                                targetId: user.id,
                                fileType: 'userFiles',
                            },
                            orderBy: {
                                createdAt: 'desc',
                            },
                        });

                        return {
                            ...user,
                            image: file?.fileUrl || null,
                        };
                    })
                );

                return {
                    ...vehicle,
                    drivers: driversWithImages,
                };
            })
        );

        return new BaseResponse(200, 'Liste des véhicules du partenaire avec conducteurs et images', enrichedVehicles);
    }


    async getVehiclesWithDrivers(
        partnerId: string,
        params: PaginationParamsDto
    ): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        // Étape 1 : utiliser le service de pagination générique
        const data = await this.functionService.paginate({
            model: 'Vehicle',
            page: Number(page),
            limit: Number(limit),
            conditions: { partnerId }, // filtre sur le partenaire
            selectAndInclude: {
                select: null,
                include: {
                    partner: true,
                    drivers: true,
                },
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['vehicleFiles'], // pour les images des véhicules
        });

        // Étape 2 : enrichir les conducteurs avec leurs images
        data.data = await Promise.all(
            data.data.map(async (vehicle) => {
                const driverIds = vehicle.drivers?.map((d) => d.id) ?? [];

                const driverInfos = driverIds.length
                    ? await this.prisma.user.findMany({
                        where: { id: { in: driverIds } },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                            status: true,
                            createdAt: true,
                            passwordGenerate: true,
                        },
                    })
                    : [];

                const driversWithImages = await Promise.all(
                    driverInfos.map(async (user) => {
                        const file = await this.prisma.fileManager.findFirst({
                            where: {
                                targetId: user.id,
                                fileType: 'userFiles',
                            },
                            orderBy: {
                                createdAt: 'desc',
                            },
                        });

                        return {
                            ...user,
                            image: file?.fileUrl || null,
                        };
                    })
                );

                return {
                    ...vehicle,
                    drivers: driversWithImages,
                };
            })
        );

        return new BaseResponse(
            200,
            'Liste paginée des véhicules du partenaire avec conducteurs et images',
            data
        );
    }


}
