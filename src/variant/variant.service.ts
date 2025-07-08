import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateVariantDto, UpdateVariantDto } from 'src/dto/request/variant.dto';

@Injectable()
export class VariantService {
    constructor(private readonly prisma: PrismaService) { }

    async createVariant(data: CreateVariantDto): Promise<BaseResponse<{ variantId: string }>> {
        try {
            const variant = await this.prisma.variant.create({
                data: {
                    name: data.name,
                    value: data.value,
                    price: data.price,
                    variantType: data.variantType,
                    addedById: data.addedById,
                },
            });
            return new BaseResponse(201, 'Variant créé', { variantId: variant.id });
        } catch (error) {
            // console.error(error);
            throw new InternalServerErrorException(
                'Erreur lors de la création du variant'
            );
        }
    }

    async createVariantsBulk(  data: CreateVariantDto[]): Promise<BaseResponse<{ count: number }>> {
        try {
            // Utilisation de createMany pour insérer en masse, skipDuplicates évite les doublons
            const result = await this.prisma.variant.createMany({
                data: data.map(item => ({
                    name: item.name,
                    value: item.value,
                    price: item.price,
                    variantType: item.variantType,
                    addedById: item.addedById,
                })),
                skipDuplicates: true,
            });
            return new BaseResponse(201, 'Variants créés en masse', { count: result.count });
        } catch (error) {
            throw new InternalServerErrorException(
                'Erreur lors de la création en masse des variants'
            );
        }
    }

    async getVariantById(id: string): Promise<BaseResponse<any>> {
        const variant = await this.prisma.variant.findUnique({
            where: { id },
            include: {
                // récupère les produits liés si nécessaire
                produits: {
                    select: { productId: true },
                },
            },
        });
        if (!variant) throw new NotFoundException('Variant introuvable');
        return new BaseResponse(200, 'Variant récupéré', variant);
    }

    async getAllVariants(): Promise<BaseResponse<any[]>> {
        const variants = await this.prisma.variant.findMany({
            orderBy: { name: 'asc' },
            include: {
                produits: {
                    select: { productId: true },
                },
            },
        });
        return new BaseResponse(200, 'Liste des variants récupérée', variants);
    }

    async updateVariant(
        id: string,
        data: UpdateVariantDto
    ): Promise<BaseResponse<{ variantId: string }>> {
        const existing = await this.prisma.variant.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Variant introuvable');

        try {
            await this.prisma.variant.update({
                where: { id },
                data: {
                    name: data.name,
                    value: data.value,
                    price: data.price,
                    variantType: data.variantType,
                },
            });
            return new BaseResponse(200, 'Variant mis à jour', { variantId: id });
        } catch (error) {
            // console.error(error);
            throw new InternalServerErrorException(
                'Erreur lors de la mise à jour du variant'
            );
        }
    }

    async deleteVariant(id: string): Promise<BaseResponse<null>> {
        const existing = await this.prisma.variant.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Variant introuvable');

        try {
            await this.prisma.variant.delete({ where: { id } });
            return new BaseResponse(200, 'Variant supprimé', null);
        } catch (error) {
            // console.error(error);
            throw new InternalServerErrorException(
                'Erreur lors de la suppression du variant'
            );
        }
    }

}
