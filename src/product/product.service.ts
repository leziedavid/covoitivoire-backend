import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { CreateProductDto, UpdateProductDto } from 'src/dto/request/product.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { ServiceType } from '@prisma/client';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
    ) { }




    private async generateUniqueSku(name: string): Promise<string> {
        const baseSku = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').substring(0, 20);

        let sku: string;
        let exists = true;
        let counter = 0;

        do {
            const suffix = Date.now().toString().slice(-5) + (counter > 0 ? `-${counter}` : '');
            sku = `${baseSku}-${suffix}`;

            const existingProduct = await this.prisma.product.findUnique({
                where: { sku },
            });

            exists = !!existingProduct;
            counter++;
        } while (exists && counter < 10); // pour éviter boucle infinie

        if (exists) {
            throw new Error('Impossible de générer un SKU unique après plusieurs tentatives.');
        }

        return sku;
    }

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
        // Génération automatique du SKU
        const sku = await this.generateUniqueSku(productData.name);

        // 3. Création du produit
        const product = await this.prisma.product.create({
            data: {
                // on étale uniquement les champs autorisés
                name: productData.name,
                description: productData.description,
                sku: sku,
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

        // if (variantIds && variantIds.length > 0) {
        //     await this.prisma.produitListeVariante.createMany({
        //         data: variantIds.map((variantId) => ({
        //             productId: product.id,
        //             variantId,
        //         })),
        //         skipDuplicates: true,
        //     });
        // }

          // 6. Traitement des variantes (parser CSV s'il le faut)
        let parsedVariantIds: string[] = [];

        if (typeof variantIds === 'string') {
            parsedVariantIds = variantIds.split(',').map((id) => id.trim());
        } else if (Array.isArray(variantIds)) {
            parsedVariantIds = variantIds;
        }

        if (parsedVariantIds.length > 0) {
            const existingVariants = await this.prisma.variant.findMany({
                where: { id: { in: parsedVariantIds } },
                select: { id: true },
            });

            const validVariantIds = existingVariants.map((v) => v.id);

            if (validVariantIds.length !== parsedVariantIds.length) {
                throw new BadRequestException("Une ou plusieurs variantes sont invalides.");
            }

            await this.prisma.produitListeVariante.createMany({
                data: validVariantIds.map((variantId) => ({
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
                    category: true,
                    addedBy: true,
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


    async getUserProductStats(userId: string): Promise<BaseResponse<any>> {
        const [productCount, totalStock, totalSold, orderCount] = await Promise.all([
            // Nombre total de produits créés par l'utilisateur
            this.prisma.product.count({
                where: {
                    addedById: userId,
                },
            }),
            // Stock total de tous les produits de l'utilisateur
            this.prisma.product.aggregate({
                where: {
                    addedById: userId,
                },
                _sum: {
                    stock: true,
                },
            }),
            // Total des produits vendus (quantité) dans les commandes complétées
            this.prisma.ecommerceOrderItem.aggregate({
                where: {
                    ecommerceOrder: {
                        status: 'COMPLETED',
                    },
                    product: {
                        addedById: userId,
                    },
                },
                _sum: {
                    quantity: true,
                },
            }),
            // Nombre de commandes distinctes contenant les produits de l'utilisateur
            this.prisma.ecommerceOrder.count({
                where: {
                    items: {
                        some: {
                            product: {
                                addedById: userId,
                            },
                        },
                    },
                },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques des produits de l’utilisateur', {
            totalProducts: productCount,
            totalStock: totalStock._sum.stock || 0,
            totalOrders: orderCount,
            totalSoldProducts: totalSold._sum.quantity || 0,
        });
    }

    async getGlobalProductStats(): Promise<BaseResponse<any>> {
        const [productCount, totalStock, totalSold, orderCount] = await Promise.all([
            // Nombre total de produits dans le système
            this.prisma.product.count(),
            // Stock total de tous les produits
            this.prisma.product.aggregate({
                _sum: {
                    stock: true,
                },
            }),
            // Total des produits vendus (quantité) dans les commandes complétées
            this.prisma.ecommerceOrderItem.aggregate({
                where: {
                    ecommerceOrder: {
                        status: 'COMPLETED',
                    },
                },
                _sum: {
                    quantity: true,
                },
            }),
            // Nombre total de commandes contenant au moins un produit
            this.prisma.ecommerceOrder.count({
                where: {
                    items: {
                        some: {}, // commande avec au moins un item
                    },
                },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques globales des produits', {
            totalProducts: productCount,
            totalStock: totalStock._sum.stock || 0,
            totalOrders: orderCount,
            totalSoldProducts: totalSold._sum.quantity || 0,
        });
    }


    async getOrdersAndRevenueStats(startDate?: Date, endDate?: Date): Promise<BaseResponse<any>> {
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : subMonths(end, 11);

        const months: string[] = [];
        const ordersData: number[] = [];
        const revenueData: number[] = [];

        const current = new Date(start);
        while (current <= end) {
            months.push(format(current, 'yyyy-MM'));
            current.setMonth(current.getMonth() + 1);
        }

        const orders = await this.prisma.ecommerceOrder.findMany({
            where: {
                status: 'COMPLETED',
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

        // 🔁 Réorganiser les mois dans l'ordre de janvier à décembre
        const merged = months.map((label) => ({
            label,
            monthNumber: parseInt(label.split('-')[1], 10), // extrait le mois (ex: '2025-01' → 1)
            orders: grouped.get(label)?.orders ?? 0,
            revenue: grouped.get(label)?.revenue ?? 0,
        }));

        merged.sort((a, b) => a.monthNumber - b.monthNumber); // ordre Jan → Déc

        const sortedLabels = merged.map((item) => item.label);
        const sortedOrders = merged.map((item) => item.orders);
        const sortedRevenue = merged.map((item) => item.revenue);

        return new BaseResponse(200, 'Statistiques commandes et revenus par mois (triés Janv → Déc)', {
            labels: sortedLabels,
            orders: sortedOrders,
            revenue: sortedRevenue,
        });
    }



}
