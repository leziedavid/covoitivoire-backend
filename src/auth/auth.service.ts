import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { UserStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { RegisterDto } from 'src/dto/request/register.dto';
import { LoginDto } from 'src/dto/request/login.dto';
import { UpdateUserDto } from 'src/dto/request/updateUser.dto';
import { ChangePasswordDto } from 'src/dto/request/change-password.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDataDto, FileManagerDto, WalletDto, TransactionDto, VehicleDto, TripDto, StopPointDto, OrderDto, ServiceOrderDto, MenuItemDto, ServiceWithMenusDto } from 'src/dto/response/user-responseData.dto'; // adapte l'import
import * as jwt from 'jsonwebtoken';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService } from 'src/utils/pagination.service';
import { FilesUpdateDto } from 'src/dto/request/filesUpdatedto';
import { UpdateProfileDto } from 'src/dto/request/update-profile.dto';


@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
        
    ) { }

    private generateAccountNumber(): string {
        return `NR ${Math.floor(Math.random() * 1000000000000)}`; // Exemple de génération de numéro unique
    }

    /** Enregistrement d’un nouvel utilisateur */
    async register(dto: RegisterDto): Promise<BaseResponse<{ userId: string }>> {

        const accountNumberGenearate = this.generateAccountNumber();
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new UnauthorizedException('Email déjà utilisé');

        const hashed = await bcrypt.hash(dto.password, 10);
        const passwordGenerat: string | null = dto.password ? dto.password : null;

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                phoneCountryCode: dto.phoneCountryCode,
                phoneNumber: dto.phoneNumber,
                password: hashed,
                passwordGenerate: passwordGenerat,
                role: dto.role,
                status: UserStatus.INACTIVE,
                wallet: { create: { balance: 0, accountNumber:accountNumberGenearate } },
            },
        });

        if (dto.file) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userFiles',
                        targetId: user.id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }
        // Image de la carte nationale didentité  accountNumber:accountNumber
        if (dto.carte) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userCarte',
                        targetId: user.id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }
        // image du permis de conduite
        if (dto.permis) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userPermis',
                        targetId: user.id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }

        return new BaseResponse(201, 'Utilisateur créé', { userId: user.id });
    }

    /** Connexion utilisateur + génération tokens */
    async login(dto: LoginDto): Promise<BaseResponse<{ access_token: string; refresh_token: string; user: any }>> {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new UnauthorizedException('Utilisateur non trouvé');

        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) throw new UnauthorizedException('Mot de passe incorrect');
        if (user.status === UserStatus.INACTIVE) throw new UnauthorizedException('Compte inactif');
        if (user.status === UserStatus.BLOCKED) throw new UnauthorizedException('Compte bloqué');

        // 🔍 Récupération de l'image liée à l'utilisateur
        const file = await this.prisma.fileManager.findFirst({
            where: {targetId: user.id,fileType: 'userFiles',},
            orderBy: { createdAt: 'desc' }, // au cas où plusieurs images
        });

        // findwallet
        const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });

        const imageUrl = file?.fileUrl || null;

        const payload = { sub: user.id, role: user.role, status: user.status,name:user.name, imageUrl,partnerId:user.partnerId,wallet:wallet.balance,compte:wallet.accountNumber };
        const access = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refresh = this.jwtService.sign(payload, { expiresIn: '7d' });

        return new BaseResponse(200, 'Connexion réussie', {
            access_token: access,
            refresh_token: refresh,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                imageUrl,
                partnerId: user.partnerId,
            },
        });
    }

    /** Rafraîchir access token */
    async refreshToken(token: string): Promise<BaseResponse<{ access_token: string }>> {
        try {
            const payload = this.jwtService.verify(token);
            const access = this.jwtService.sign(
                { sub: payload.sub, role: payload.role, status: payload.status,name: payload.name ,imageUrl: payload.imageUrl,partnerId:payload.partnerId,wallet:payload.balance,compte:payload.accountNumber },
                
                { expiresIn: '15m' },
            );
            return new BaseResponse(200, 'Token rafraîchi', { access_token: access });
        } catch {
            throw new UnauthorizedException('Refresh token invalide ou expiré');
        }
    }

    /** Mise à jour du profil utilisateur */
    async updateUser(id: string, dto: UpdateUserDto): Promise<BaseResponse<{ user: any }>> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const data: any = {};
        if (dto.name) data.name = dto.name;
        if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
        if (dto.role) data.role = dto.role;
        if (dto.status) data.status = dto.status;

        const updated = await this.prisma.user.update({ where: { id }, data });

        // 🔁 Fonction réutilisable pour chaque type de fichier
        const handleFileUpdate = async (buffer: Buffer, fileType: string) => {
            const existingFile = await this.prisma.fileManager.findFirst({
                where: { targetId: id, fileType },
                orderBy: { createdAt: 'desc' },
            });

            if (existingFile?.fileCode) {
                await this.cloudinary.deleteFileByPublicId(existingFile.fileCode);
            }

            if (existingFile) {
                await this.prisma.fileManager.deleteMany({
                    where: { fileType, targetId: id },
                });
            }

            const upload = await this.cloudinary.uploadFile(buffer, 'users');

            await this.prisma.fileManager.create({
                data: {
                    ...upload,
                    fileType,
                    targetId: id,
                },
            });
        };

        // 📎 Mise à jour des fichiers
        try {
            if (dto.file) {
                await handleFileUpdate(dto.file.buffer, 'userFiles');
            }

            if (dto.carte) {
                await handleFileUpdate(dto.carte.buffer, 'userCarte');
            }

            if (dto.permis) {
                await handleFileUpdate(dto.permis.buffer, 'userPermis');
            }
        } catch (err) {
            throw new InternalServerErrorException("Erreur lors de la mise à jour d’un fichier utilisateur");
        }

        return new BaseResponse(200, 'Profil mis à jour', { user: updated });
    }

    /** Mise à jour du profil utilisateur */
    async updateUser2(id: string, dto: UpdateUserDto): Promise<BaseResponse<{ user: any }>> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const data: any = {};
        if (dto.name) data.name = dto.name;
        if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
        if (dto.role) data.role = dto.role;
        if (dto.status) data.status = dto.status;

        const updated = await this.prisma.user.update({ where: { id }, data });

        if (dto.file) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.deleteMany({
                    where: { fileType: 'userFiles', targetId: id },
                });

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userFiles',
                        targetId: id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de la mise à jour de l’image');
            }
        }

        if (dto.carte) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.deleteMany({
                    where: { fileType: 'userCarte', targetId: id },
                });

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userCarte',
                        targetId: id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de la mise à jour de l’image');
            }
        }


        if (dto.permis) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.deleteMany({
                    where: { fileType: 'userPermis', targetId: id },
                });

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userPermis',
                        targetId: id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de la mise à jour de l’image');
            }
        }

        return new BaseResponse(200, 'Profil mis à jour', { user: updated });
    }

    /**
   * Valide ou met à jour le statut du compte utilisateur
   * @param id ID de l'utilisateur
   * @param status Nouveau statut (UserStatus enum)
   */
    async validateCompte(id: string, status: UserStatus): Promise<BaseResponse<null>> {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        await this.prisma.user.update({
            where: { id },
            data: { status },
        });

        return new BaseResponse(200, `Compte mis à jour au statut ${status}`, null);
    }

    async deleteUser(id: string): Promise<BaseResponse<null>> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const files = await this.prisma.fileManager.findMany({
            where: { fileType: 'userFiles', targetId: id },
        });

        if (files.length) {
            for (const file of files) {
                try {
                    await this.cloudinary.deleteFileByPublicId(file.fileCode);
                } catch (err) {
                    console.warn(`Erreur suppression Cloudinary du fichier ${file.fileCode}`);
                }
            }

            await this.prisma.fileManager.deleteMany({
                where: { fileType: 'userFiles', targetId: id },
            });
        }

        await this.prisma.user.delete({ where: { id } });

        return new BaseResponse(200, 'Utilisateur supprimé', null);
    }

    /** Changement de mot de passe */
    async changePassword(dto: ChangePasswordDto): Promise<BaseResponse<null>> {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new NotFoundException('Utilisateur non trouvé');

        const valid = await bcrypt.compare(dto.oldPassword, user.password);
        if (!valid) throw new UnauthorizedException('Ancien mot de passe incorrect');

        const hashed = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { email: dto.email },
            data: { password: hashed },
        });

        return new BaseResponse(200, 'Mot de passe changé avec succès', null);
    }

    async mapUserToResponse(user: any): Promise<BaseResponse<UserResponseDataDto>> {
        // Récupération de l'image de profil utilisateur
        const profileImage = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });

        // Fonction utilitaire pour récupérer les fichiers d'un véhicule
        const getVehicleFiles = async (vehicleId: string): Promise<FileManagerDto[]> => {
            const vehicleFiles = await this.prisma.fileManager.findMany({
                where: { targetId: vehicleId, fileType: 'vehicleFiles' },
                orderBy: { createdAt: 'desc' },
            });
            return vehicleFiles.map(file => plainToInstance(FileManagerDto, file));
        };

        // Pour chaque véhiculeOwned, on récupère les fichiers associés
        const vehiclesOwnedWithFiles = await Promise.all(
            (user.vehiclesOwned ?? []).map(async (vehicle: any) => {
                const files = await getVehicleFiles(vehicle.id);
                return plainToInstance(VehicleDto, { ...vehicle, files });
            }),
        );

        // Même chose pour vehiclesDriven
        const vehiclesDrivenWithFiles = await Promise.all(
            (user.vehiclesDriven ?? []).map(async (vehicle: any) => {
                const files = await getVehicleFiles(vehicle.id);
                return plainToInstance(VehicleDto, { ...vehicle, files });
            }),
        );

        // Construction du DTO final
        const dto = plainToInstance(UserResponseDataDto, {
            ...user,
            imageUrl: profileImage?.fileUrl || null,
            wallet: user.wallet
                ? {
                    ...user.wallet,
                    transactions: (user.wallet.transactions ?? []).map(tx =>
                        plainToInstance(TransactionDto, tx),
                    ),
                }
                : null,
            vehiclesOwned: vehiclesOwnedWithFiles,
            vehiclesDriven: vehiclesDrivenWithFiles,
            trips: (user.trips ?? []).map(trip => ({
                ...trip,
                stopPoints: (trip.stopPoints ?? []).map(sp => plainToInstance(StopPointDto, sp)),
            })),
            orders: (user.orders ?? []).map(order => ({
                ...order,
                trip: {
                    ...order.trip,
                    stopPoints: (order.trip?.stopPoints ?? []).map(sp =>
                        plainToInstance(StopPointDto, sp),
                    ),
                },
            })),
            serviceOrders: (user.serviceOrders ?? []).map(so => ({
                ...so,
                menuItem: plainToInstance(MenuItemDto, so.menuItem),
            })),
            services: (user.services ?? []).map(service => ({
                ...service,
                menuItems: (service.menuItems ?? []).map(mi => plainToInstance(MenuItemDto, mi)),
            })),

            // === ✅ Nouveau ===
            partnerId: user.partnerId || null,
            partner: user.partner ? plainToInstance(UserResponseDataDto, user.partner) : null,
            drivers: (user.drivers ?? []).map(driver => plainToInstance(UserResponseDataDto, driver)),
        });

        return new BaseResponse(200, 'Données utilisateur récupérées', dto);
    }

    async ParametresuserData(userId: string): Promise<BaseResponse<any>> {
        // Étape 1 : Requête vers la table user (avec le wallet en relation)
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                wallet: true, // inclure le portefeuille lié
            },
        });

        if (!user) {
            return new BaseResponse(404, "Utilisateur introuvable", null);
        }

        // Étape 2 : Récupération de l'image de profil
        const profileImage = await this.prisma.fileManager.findFirst({
            where: { targetId: userId, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });

        // Étape 3 : Construction de la réponse simplifiée
        const simplifiedUserData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneCountryCode: user.phoneCountryCode,
            phoneNumber: user.phoneNumber,
            role: user.role,
            status: user.status,
            imageUrl: profileImage?.fileUrl || null,
            wallet: user.wallet
                ? {
                    id: user.wallet.id,
                    balance: user.wallet.balance,
                    paymentMethod: user.wallet.paymentMethod,
                    rechargeType: user.wallet.rechargeType,
                    accountNumber: user.wallet.accountNumber,
                }
                : null,
        };

        return new BaseResponse(200, 'Données utilisateur récupérées', simplifiedUserData);
    }

    async updateFiles(userId: string, dto: FilesUpdateDto) {
        if (!dto.file) return;

        // Étape 1 : Récupérer l'image existante (si elle existe)
        const existingImage = await this.prisma.fileManager.findFirst({
            where: {
                targetId: userId,
                fileType: 'userFiles',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Étape 2 : Supprimer sur Cloudinary si l'image existe
        if (existingImage?.fileCode) {
            await this.cloudinary.deleteFileByPublicId(existingImage.fileCode);
        }

        // Étape 3 : Supprimer l’entrée en base (fileManager)
        if (existingImage) {
            await this.prisma.fileManager.deleteMany({
                where: { fileType: 'userFiles', targetId: userId },
            });
        }

        // Étape 4 : Upload du nouveau fichier sur Cloudinary
        try {
            const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

            // Étape 5 : Création de la nouvelle entrée
            await this.prisma.fileManager.create({
                data: {
                    ...upload,
                    fileType: 'userFiles',
                    targetId: userId,
                },
            });

        } catch (err) {

            console.error(err);
            throw new InternalServerErrorException("Erreur lors de la mise à jour de l’image");
        }

        return new BaseResponse(200, 'Profil mis à jour avec succès', null);

    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new NotFoundException('Utilisateur introuvable')

        const updateData: any = {}

        if (dto.name) updateData.name = dto.name
        if (dto.email) updateData.email = dto.email
        if (dto.phoneNumber) updateData.phoneNumber = dto.phoneNumber
        if (dto.phoneCountryCode) updateData.phoneCountryCode = dto.phoneCountryCode
        if (dto.password) updateData.password = await bcrypt.hash(dto.password, 10)

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        })

    return new BaseResponse(200, 'Profil mis à jour avec succès', updatedUser);
    }

    async assignVehicleToDriver(vehicleId: string, driverId: string): Promise<BaseResponse<null>> {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) throw new NotFoundException('Véhicule introuvable');

        const driver = await this.prisma.user.findUnique({ where: { id: driverId } });

        const allowedRoles = ['DRIVER', 'PARTNER'];
        if (!driver || !allowedRoles.includes(driver.role)) {
            throw new UnauthorizedException('Chauffeur invalide');
        }

        await this.prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                drivers: { connect: { id: driverId } },  // ici "drivers" au pluriel
            },
        });

        return new BaseResponse(200, 'Chauffeur affecté au véhicule', null);
    }

    async removeDriverFromVehicle(vehicleId: string, driverId: string): Promise<BaseResponse<null>> {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) throw new NotFoundException('Véhicule introuvable');

        await this.prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                drivers: { disconnect: { id: driverId } },  // on déconnecte le chauffeur ciblé
            },
        });

        return new BaseResponse(200, 'Chauffeur retiré du véhicule', null);
    }

    async addDriverByPartner(partnerId: string, dto: RegisterDto): Promise<BaseResponse<{ userId: string }>> {
        
        const accountNumberGenearate = this.generateAccountNumber();

        const partner = await this.prisma.user.findUnique({ where: { id: partnerId } });

        if (!partner || partner.role !== 'PARTNER') throw new UnauthorizedException('Seul un partenaire peut ajouter un chauffeur');

        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new UnauthorizedException('Email déjà utilisé');
        const hashed = await bcrypt.hash(dto.password, 10);

        const driver = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                password: hashed,
                role: 'DRIVER',
                status: UserStatus.INACTIVE,
                wallet: { create: { balance: 0, accountNumber:accountNumberGenearate } },
                partner: { connect: { id: partnerId } },
            },
        });

        if (dto.file) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userFiles',
                        targetId: driver.id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }
        // Image de la carte nationale didentité  accountNumber:accountNumber
        if (dto.carte) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userCarte',
                        targetId: driver.id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }
        // image du permis de conduite
        if (dto.permis) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userPermis',
                        targetId: driver.id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }

        return new BaseResponse(201, 'Chauffeur ajouté avec succès', { userId: driver.id });
    }

    async mapUserToResponse2(user: any): Promise<BaseResponse<UserResponseDataDto>> {
        
        const profileImage = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });

        const files = await this.prisma.fileManager.findMany({
            where: { targetId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        
        const dto = plainToInstance(UserResponseDataDto, {
            ...user,
            imageUrl: profileImage?.fileUrl || null,
            files: files.map(file => plainToInstance(FileManagerDto, file)),

            wallet: user.wallet
                ? {
                    ...user.wallet,
                    transactions: user.wallet.transactions.map(tx =>
                        plainToInstance(TransactionDto, tx),
                    ),
                }
                : null,

            vehiclesOwned: user.vehiclesOwned.map(vehicle =>
                plainToInstance(VehicleDto, vehicle),
            ),

            vehiclesDriven: user.vehiclesDriven.map(vehicle =>
                plainToInstance(VehicleDto, vehicle),
            ),

            trips: user.trips.map(trip => ({
                ...trip,
                stopPoints: trip.stopPoints.map(sp => plainToInstance(StopPointDto, sp)),
            })),

            orders: user.orders.map(order => ({
                ...order,
                trip: {
                    ...order.trip,
                    stopPoints: order.trip.stopPoints.map(sp =>
                        plainToInstance(StopPointDto, sp),
                    ),
                },
            })),

            serviceOrders: user.serviceOrders.map(so => ({
                ...so,
                menuItem: plainToInstance(MenuItemDto, so.menuItem),
            })),

            services: user.services.map(service => ({
                ...service,
                menuItems: service.menuItems.map(mi => plainToInstance(MenuItemDto, mi)),
            })),
        });

        return new BaseResponse(200, 'Données utilisateur récupérées', dto);
    }


    async getDriversByPartner(userId: string): Promise<BaseResponse<any>> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'PARTNER')) {
            throw new UnauthorizedException('Seuls les administrateurs ou les partenaires peuvent accéder à cette ressource');
        }

        const partnerId = user.role === 'PARTNER' ? user.id : undefined;

        // Récupération des chauffeurs liés au partenaire (si PARTNER) ou tous (si ADMIN)
        let drivers = await this.prisma.user.findMany({
            where: {
                role: 'DRIVER',
                ...(partnerId && { partnerId }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                status: true,
                createdAt: true,
                passwordGenerate: true,
                partner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Si aucun chauffeur trouvé et que le user est PARTNER ou ADMIN, on ajoute le propriétaire
        if (drivers.length === 0 && user.role === 'PARTNER' || user.role === 'ADMIN') {
            drivers = [
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    status: user.status,
                    createdAt: user.createdAt,
                    passwordGenerate: user.passwordGenerate,
                    partner: null, // Il n'a pas de partenaire, car c'est lui-même
                }
            ];
        }

        // Ajout des images de profil
        const driversWithProfileImages = await Promise.all(
            drivers.map(async (driver) => {
                const profileImage = await this.prisma.fileManager.findFirst({
                    where: { targetId: driver.id, fileType: 'userFiles' },
                    orderBy: { createdAt: 'desc' },
                });

                return {
                    ...driver,
                    profileImageUrl: profileImage?.fileUrl || null,
                };
            })
        );

        return new BaseResponse(200, 'Liste des chauffeurs récupérée avec succès', driversWithProfileImages);
    }


    async getDriversByPartner2(userId: string): Promise<BaseResponse<any>> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'PARTNER')) {
            throw new UnauthorizedException('Seuls les administrateurs ou les partenaires peuvent accéder à cette ressource');
        }

        // Si PARTNER, on récupère son propre ID comme partnerId
        const partnerId = user.role === 'PARTNER' ? user.id : undefined;

        const drivers = await this.prisma.user.findMany({
            where: {
                role: 'DRIVER',
                ...(partnerId && { partnerId }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const driversWithProfileImages = await Promise.all(
            drivers.map(async (driver) => {
                const profileImage = await this.prisma.fileManager.findFirst({
                    where: { targetId: driver.id, fileType: 'userFiles' },
                    orderBy: { createdAt: 'desc' },
                });

                return {
                    ...driver,
                    profileImageUrl: profileImage?.fileUrl || null,
                };
            })
        );

        return new BaseResponse(200, 'Liste des chauffeurs récupérée avec succès', driversWithProfileImages);
    }


    /** 🔍 Liste paginée de tous les utilisateurs avec relations */
    async getAllUsers(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'User',
            page: Number(page),
            limit: Number(limit),
            conditions: {},
            selectAndInclude: {
                select: null,
                include: {
                    wallet: true,
                    vehiclesOwned: true,
                    vehiclesDriven: true,
                    trips: true,
                    tripsAsDriver: true,
                    partner: true,
                    drivers: true,
                    transactions: true,
                    serviceSubscriptions: {
                        include: {
                            service: true,
                        },
                    },
                    orders: true,
                    ecommerceOrders: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Une seule boucle pour récupérer tous les fichiers
        const usersWithFiles = await Promise.all(
            data.data.map(async (user) => {
                const [imageFile, cniFile, permisFile] = await Promise.all([
                    this.prisma.fileManager.findFirst({
                        where: { targetId: user.id, fileType: 'userFiles' },
                        orderBy: { createdAt: 'desc' },
                    }),
                    this.prisma.fileManager.findFirst({
                        where: { targetId: user.id, fileType: 'userCarte' },
                        orderBy: { createdAt: 'desc' },
                    }),
                    this.prisma.fileManager.findFirst({
                        where: { targetId: user.id, fileType: 'userPermis' },
                        orderBy: { createdAt: 'desc' },
                    }),
                ]);

                return {
                    ...user,
                    image: imageFile?.fileUrl || null,
                    carte: cniFile?.fileUrl || null,
                    permis: permisFile?.fileUrl || null,
                };
            })
        );

        return new BaseResponse(200, 'Liste des utilisateurs', {
            ...data,
            data: usersWithFiles, // Remplace data avec utilisateurs enrichis
        });
    }


}
