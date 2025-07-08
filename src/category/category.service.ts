import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/request/category.dto';

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) { }

    async createCategory(data: CreateCategoryDto, addedById: string): Promise<BaseResponse<{ categoryId: string }>> {
        try {
            // Injecte addedById explicitement ici, car il ne doit pas venir du client directement
            const category = await this.prisma.category.create({
                data: {
                    ...data,
                    addedById,
                },
            });
            return new BaseResponse(201, 'Catégorie créée', { categoryId: category.id });
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la création de la catégorie');
        }
    }

    async createCategoryBulk(categories: CreateCategoryDto[], addedById: string): Promise<BaseResponse<{ createdCount: number }>> {
        try {
            // Préparer les données en injectant addedById dans chaque élément
            const dataToCreate = categories.map(category => ({
                ...category,
                addedById,
            }));

            // Utiliser createMany de Prisma pour l'insertion en lot
            const result = await this.prisma.category.createMany({
                data: dataToCreate,
                skipDuplicates: true, // optionnel, ignore les doublons si besoin
            });

            return new BaseResponse(201, 'Catégories créées en lot', { createdCount: result.count });
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la création en lot des catégories');
        }
    }

    async getCategoryById(id: string): Promise<BaseResponse<any>> {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) throw new NotFoundException('Catégorie introuvable');
        return new BaseResponse(200, 'Catégorie récupérée', category);
    }

    async getAllCategories(): Promise<BaseResponse<any[]>> {
        const categories = await this.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        return new BaseResponse(200, 'Liste des catégories récupérée', categories);
    }

    async updateCategory(id: string, data: UpdateCategoryDto): Promise<BaseResponse<{ categoryId: string }>> {
        const existing = await this.prisma.category.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Catégorie introuvable');

        try {
            // Ne pas permettre de modifier addedById via updateDto si tu veux la garder sécurisée
            const { addedById, id: dtoId, ...dataToUpdate } = data as any;

            await this.prisma.category.update({
                where: { id },
                data: dataToUpdate,
            });
            return new BaseResponse(200, 'Catégorie mise à jour', { categoryId: id });
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la mise à jour de la catégorie');
        }
    }

    async deleteCategory(id: string): Promise<BaseResponse<null>> {
        const existing = await this.prisma.category.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Catégorie introuvable');

        try {
            await this.prisma.category.delete({ where: { id } });
            return new BaseResponse(200, 'Catégorie supprimée', null);
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la suppression de la catégorie');
        }
    }
}
