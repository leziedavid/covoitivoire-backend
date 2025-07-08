import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { CreateProductDto, UpdateProductDto } from 'src/dto/request/product.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { ServiceType } from '@prisma/client';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
    ) { }

    async createProduct(dto: CreateProductDto, userId: string): Promise<BaseResponse<{ productId: string }>> {

        // 1. Vérification de l’abonnement à l’évènement
        const activeService = await this.prisma.service.findFirst({
            where: {
                type: ServiceType.ECOMMERCE,
                // partnerId: userId, // Le partenaire du service est l'utilisateur
                subscriptions: {
                    some: {
                        userId: userId, // 👈 Ajout de la vérification utilisateur
                        endDate: { gt: new Date() },
                        status: { not: 'CANCELLED' }, // 👈 Exclure les souscriptions annulées
                    },
                },
            },
        });

        // console.dir(services, { depth: null });

        if (!activeService) {
            throw new ForbiddenException('Abonnement ECOMMERCE invalide ou expiré');
        }
           // Extraire les données de la requête
        const { files, imageFile, variantIds, categoryId, price, stock, ...productData } = dto as any;
        // Convertir price et stock en nombres (si ce ne sont pas déjà des nombres)
        const priceNumber = parseFloat(price);
        const stockNumber = parseInt(stock, 10);

        let imageUrl = null;
        if (imageFile) {
            const uploadResult = await this.cloudinary.uploadFile(imageFile.buffer, 'products');
            imageUrl = uploadResult.fileUrl;
        }

        // 3. Création du produit
        const product = await this.prisma.product.create({
            data: {
                // on étale uniquement les champs autorisés
                name: productData.name,
                description: productData.description,
                sku: productData.sku,
                imageUrl,
                price: priceNumber,
                stock: stockNumber,
                addedBy: {
                    connect: { id: userId },
                },
                service: {
                    connect: { id: activeService.id },
                },
                category: {
                    connect: { id: categoryId },
                },
            },
        });

        if (variantIds && variantIds.length > 0) {
            await this.prisma.produitListeVariante.createMany({
                data: variantIds.map((variantId) => ({
                    productId: product.id,
                    variantId,
                })),
                skipDuplicates: true,
            });
        }

        if (files && files.length > 0) {
            for (const file of files) {
                const upload = await this.cloudinary.uploadFile(file.buffer, 'productFiles');
                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'productFiles',
                        targetId: product.id,
                    },
                });
            }
        }

        return new BaseResponse(201, 'Produit créé avec succès', { productId: product.id });
    }

    async getProductById(id: string): Promise<BaseResponse<any>> {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                variants: { include: { variant: true } },
                category: true,
                service: true,
                addedBy: true,
            },
        });

        if (!product) throw new NotFoundException('Produit introuvable');

        const files = await this.prisma.fileManager.findMany({
            where: { fileType: 'productFiles', targetId: id },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Détails du produit', {
            ...product,
            variants: product.variants.map((v) => v.variant),
            files,
        });
    }

    async updateProduct(id: string, dto: UpdateProductDto, userId: string): Promise<BaseResponse<null>> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Produit introuvable');

        if (product.addedById !== userId) {
            throw new ForbiddenException('Vous n’êtes pas autorisé à modifier ce produit');
        }

        const { files, imageFile, variantIds, ...productData } = dto as any;

        await this.prisma.product.update({
            where: { id },
            data: productData,
        });

        if (imageFile) {
            const uploadResult = await this.cloudinary.uploadFile(imageFile.buffer, 'products');
            await this.prisma.product.update({
                where: { id },
                data: { imageUrl: uploadResult.fileUrl },
            });
        }

        if (files && files.length > 0) {
            for (const file of files) {
                const upload = await this.cloudinary.uploadFile(file.buffer, 'productFiles');
                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'productFiles',
                        targetId: id,
                    },
                });
            }
        }

        if (variantIds) {
            await this.prisma.produitListeVariante.deleteMany({ where: { productId: id } });
            await this.prisma.produitListeVariante.createMany({
                data: variantIds.map((variantId) => ({ productId: id, variantId })),
                skipDuplicates: true,
            });
        }

        return new BaseResponse(200, 'Produit mis à jour', null);
    }

    async deleteProduct(id: string, userId: string): Promise<BaseResponse<null>> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Produit introuvable');

        if (product.addedById !== userId) {
            throw new ForbiddenException('Vous n’êtes pas autorisé à supprimer ce produit');
        }

        const files = await this.prisma.fileManager.findMany({
            where: { fileType: 'productFiles', targetId: id },
        });

        for (const file of files) {
            try {
                await this.cloudinary.deleteFileByPublicId(file.fileCode);
            } catch {
                console.warn(`Erreur suppression fichier Cloudinary: ${file.fileCode}`);
            }
        }

        if (files.length) {
            await this.prisma.fileManager.deleteMany({ where: { targetId: id } });
        }

        await this.prisma.produitListeVariante.deleteMany({ where: { productId: id } });
        await this.prisma.product.delete({ where: { id } });

        return new BaseResponse(200, 'Produit supprimé', null);
    }


    async getProductsByService(serviceId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const now = new Date();
        const { page, limit } = params;
        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: {
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
            selectAndInclude: {
                include: {
                    service: true,
                    variants: { include: { variant: true } },
                },
                select: null,
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['productFiles'],
        };

        const data = await this.functionService.paginate(paginateOptions);

        data.data = data.data.map((product) => ({
            ...product,
            variants: product.variants.map((v) => v.variant),
        }));

        return new BaseResponse(200, 'Liste des produits du service', data);
    }

    async getAllValidProducts(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const now = new Date();
        const { page, limit } = params;
        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                service: {
                    subscriptions: {
                        some: {
                            startDate: { lte: now },
                            endDate: { gte: now },
                        },
                    },
                },
            },
            selectAndInclude: {
                include: {
                    service: true,
                    variants: { include: { variant: true } },
                },
                select: null,
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['productFiles'],
        };

        const data = await this.functionService.paginate(paginateOptions);

        data.data = data.data.map((product) => ({
            ...product,
            variants: product.variants.map((v) => v.variant),
        }));

        return new BaseResponse(200, 'Produits valides avec images', data);
    }

    async getUserValidProducts(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const now = new Date();
        const { page, limit } = params;
        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                service: {
                    subscriptions: {
                        some: {
                            userId,
                            startDate: { lte: now },
                            endDate: { gte: now },
                        },
                    },
                },
            },
            selectAndInclude: {
                include: {
                    service: true,
                    variants: { include: { variant: true } },
                },
                select: null,
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['productFiles'],
        };

        const data = await this.functionService.paginate(paginateOptions);

        data.data = data.data.map((product) => ({
            ...product,
            variants: product.variants.map((v) => v.variant),
        }));

        return new BaseResponse(200, 'Produits utilisateurs valides avec images', data);
    }

    async getAllProductsAdmin(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: {
                include: {
                    service: true,
                    variants: { include: { variant: true } },
                },
                select: null,
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['productFiles'],
        };

        const data = await this.functionService.paginate(paginateOptions);

        data.data = data.data.map((product) => ({
            ...product,
            variants: product.variants.map((v) => v.variant),
        }));

        return new BaseResponse(200, 'Tous les produits admin avec images', data);
    }

    // async getProductsByService(serviceId: string): Promise<BaseResponse<any[]>> {
    //     const now = new Date();

    //     const products = await this.prisma.product.findMany({
    //         where: {
    //             serviceId,
    //             service: {
    //                 subscriptions: {
    //                     some: {
    //                         startDate: { lte: now },
    //                         endDate: { gte: now },
    //                     },
    //                 },
    //             },
    //         },
    //         include: {
    //             service: true,
    //             variants: { include: { variant: true } },
    //         },
    //     });

    //     const productsWithFiles = await Promise.all(
    //         products.map(async (product) => {
    //             const files = await this.prisma.fileManager.findMany({
    //                 where: { fileType: 'productFiles', targetId: product.id },
    //                 orderBy: { createdAt: 'desc' },
    //             });
    //             return { ...product, variants: product.variants.map((v) => v.variant), files };
    //         })
    //     );

    //     return new BaseResponse(200, 'Liste des produits du service', productsWithFiles);
    // }

    // async getAllValidProducts(): Promise<BaseResponse<any[]>> {
    //     const now = new Date();

    //     const products = await this.prisma.product.findMany({
    //         where: {
    //             service: {
    //                 subscriptions: {
    //                     some: {
    //                         startDate: { lte: now },
    //                         endDate: { gte: now },
    //                     },
    //                 },
    //             },
    //         },
    //         include: {
    //             service: true,
    //             variants: { include: { variant: true } },
    //         },
    //     });

    //     const productsWithFiles = await Promise.all(
    //         products.map(async (product) => {
    //             const files = await this.prisma.fileManager.findMany({
    //                 where: { fileType: 'productFiles', targetId: product.id },
    //                 orderBy: { createdAt: 'desc' },
    //             });
    //             return { ...product, variants: product.variants.map((v) => v.variant), files };
    //         })
    //     );

    //     return new BaseResponse(200, 'Produits valides avec images', productsWithFiles);
    // }

    // async getUserValidProducts(userId: string): Promise<BaseResponse<any[]>> {
    //     const now = new Date();

    //     const products = await this.prisma.product.findMany({
    //         where: {
    //             service: {
    //                 subscriptions: {
    //                     some: {
    //                         userId,
    //                         startDate: { lte: now },
    //                         endDate: { gte: now },
    //                     },
    //                 },
    //             },
    //         },
    //         include: {
    //             service: true,
    //             variants: { include: { variant: true } },
    //         },
    //     });

    //     const productsWithFiles = await Promise.all(
    //         products.map(async (product) => {
    //             const files = await this.prisma.fileManager.findMany({
    //                 where: { fileType: 'productFiles', targetId: product.id },
    //                 orderBy: { createdAt: 'desc' },
    //             });
    //             return { ...product, variants: product.variants.map((v) => v.variant), files };
    //         })
    //     );

    //     return new BaseResponse(200, 'Produits utilisateurs valides avec images', productsWithFiles);
    // }

    // async getAllProductsAdmin(): Promise<BaseResponse<any[]>> {
    //     const products = await this.prisma.product.findMany({
    //         include: {
    //             service: true,
    //             variants: { include: { variant: true } },
    //         },
    //     });

    //     const productsWithFiles = await Promise.all(
    //         products.map(async (product) => {
    //             const files = await this.prisma.fileManager.findMany({
    //                 where: { fileType: 'productFiles', targetId: product.id },
    //                 orderBy: { createdAt: 'desc' },
    //             });
    //             return { ...product, variants: product.variants.map((v) => v.variant), files };
    //         })
    //     );

    //     return new BaseResponse(200, 'Tous les produits admin avec images', productsWithFiles);
    // }


}
