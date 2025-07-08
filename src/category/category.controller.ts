import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req,
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/request/category.dto';
import { Request } from 'express';
import { UserOrTokenAuthGuard } from 'src/guards/user-or-token.guard';


@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Créer une nouvelle catégorie' })
    @ApiResponse({ status: 201, description: 'Catégorie créée avec succès' })
    async create(@Body() dto: CreateCategoryDto, @Req() req: Request) {
    const user = req.user as any; // typage personnalisé si disponible
    const addedById = user?.userId;
        return this.categoryService.createCategory(dto, addedById);
    }

    @UseGuards(JwtAuthGuard)
    @Post('bulk')
    @ApiOperation({ summary: 'Créer plusieurs catégories en une seule requête' })
    @ApiResponse({ status: 201, description: 'Catégories créées avec succès' })
    @ApiBody({ type: CreateCategoryDto, isArray: true })
    async createBulk(@Body() dtos: CreateCategoryDto[], @Req() req: Request) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.categoryService.createCategoryBulk(dtos, addedById);
    }


    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les catégories' })
    @ApiResponse({ status: 200, description: 'Liste des catégories récupérée' })
    async getAll() {
        return this.categoryService.getAllCategories();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une catégorie par son ID' })
    @ApiResponse({ status: 200, description: 'Catégorie récupérée' })
    @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
    async getOne(@Param('id') id: string) {
        return this.categoryService.getCategoryById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour' })
    async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoryService.updateCategory(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie supprimée' })
    @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
    async delete(@Param('id') id: string) {
        return this.categoryService.deleteCategory(id);
    }
}


// [
//   { "name": "ÉLECTRONIQUE" },
//   { "name": "VÊTEMENTS" },
//   { "name": "CHAUSSURES" },
//   { "name": "MAISON & CUISINE" },
//   { "name": "BEAUTÉ & SANTÉ" },
//   { "name": "JOUETS & JEUX" },
//   { "name": "BRICOLAGE & JARDIN" },
//   { "name": "SPORTS & LOISIRS" },
//   { "name": "LIVRES" },
//   { "name": "INFORMATIQUE" },
//   { "name": "TÉLÉPHONES & ACCESSOIRES" },
//   { "name": "MONTRES & BIJOUX" },
//   { "name": "BÉBÉ & PUÉRICULTURE" },
//   { "name": "AUTO & MOTO" },
//   { "name": "ANIMAUX" },
//   { "name": "MUSIQUE & INSTRUMENTS" },
//   { "name": "MEUBLES" },
//   { "name": "ART & ARTISANAT" },
//   { "name": "GAMING & CONSOLES" },
//   { "name": "ALIMENTATION" }
// ]


// [
//   { "name": "ÉLECTRONIQUE", "addedById": "string" },
//   { "name": "VÊTEMENTS", "addedById": "string" },
//   { "name": "CHAUSSURES", "addedById": "string" },
//   { "name": "MAISON & CUISINE", "addedById": "string" },
//   { "name": "BEAUTÉ & SANTÉ", "addedById": "string" },
//   { "name": "JOUETS & JEUX", "addedById": "string" },
//   { "name": "BRICOLAGE & JARDIN", "addedById": "string" },
//   { "name": "SPORTS & LOISIRS", "addedById": "string" },
//   { "name": "LIVRES", "addedById": "string" },
//   { "name": "INFORMATIQUE", "addedById": "string" },
//   { "name": "TÉLÉPHONES & ACCESSOIRES", "addedById": "string" },
//   { "name": "MONTRES & BIJOUX", "addedById": "string" },
//   { "name": "BÉBÉ & PUÉRICULTURE", "addedById": "string" },
//   { "name": "AUTO & MOTO", "addedById": "string" },
//   { "name": "ANIMAUX", "addedById": "string" },
//   { "name": "MUSIQUE & INSTRUMENTS", "addedById": "string" },
//   { "name": "MEUBLES", "addedById": "string" },
//   { "name": "ART & ARTISANAT", "addedById": "string" },
//   { "name": "GAMING & CONSOLES", "addedById": "string" },
//   { "name": "ALIMENTATION", "addedById": "string" }
// ]
