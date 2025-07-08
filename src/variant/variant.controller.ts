import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { VariantService } from './variant.service';
import { CreateVariantDto, UpdateVariantDto } from 'src/dto/request/variant.dto';

@ApiTags('Variants')
@ApiBearerAuth('access-token')
@Controller('variants')
export class VariantController {
    constructor(private readonly variantService: VariantService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau variant' })
    @ApiBody({ type: CreateVariantDto })  // <-- Ajout ici
    @ApiResponse({ status: 201, description: 'Variant créé avec succès' })
    async create(@Body() dto: CreateVariantDto) {
        return this.variantService.createVariant(dto);
    }


    @UseGuards(JwtAuthGuard)
    @Post('bulk')
    @ApiOperation({ summary: 'Créer plusieurs variants en masse' })
    @ApiBody({ type: CreateVariantDto, isArray: true })
    @ApiResponse({ status: 201, description: 'Variants créés en masse avec succès' })
    async createBulk(@Body() dtos: CreateVariantDto[]) {
        return this.variantService.createVariantsBulk(dtos);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Récupérer tous les variants' })
    @ApiResponse({ status: 200, description: 'Liste des variants récupérée' })
    async getAll() {
        return this.variantService.getAllVariants();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un variant par son ID' })
    @ApiResponse({ status: 200, description: 'Variant récupéré' })
    @ApiResponse({ status: 404, description: 'Variant introuvable' })
    async getOne(@Param('id') id: string) {
        return this.variantService.getVariantById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un variant' })
    @ApiBody({ type: UpdateVariantDto })  // <-- Ajout ici
    @ApiResponse({ status: 200, description: 'Variant mis à jour' })
    async update(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
        return this.variantService.updateVariant(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un variant' })
    @ApiResponse({ status: 200, description: 'Variant supprimé' })
    @ApiResponse({ status: 404, description: 'Variant introuvable' })
    async delete(@Param('id') id: string) {
        return this.variantService.deleteVariant(id);
    }
}



// [
//   { "name": "Taille", "value": "XS", "price": 0, "variantType": "TAILLE", "addedById": "string" },
//   { "name": "Taille", "value": "S", "price": 0, "variantType": "TAILLE", "addedById": "string" },
//   { "name": "Taille", "value": "M", "price": 0, "variantType": "TAILLE", "addedById": "string" },
//   { "name": "Taille", "value": "L", "price": 0, "variantType": "TAILLE", "addedById": "string" },
//   { "name": "Taille", "value": "XL", "price": 0, "variantType": "TAILLE", "addedById": "string" },
//   { "name": "Taille", "value": "XXL", "price": 0, "variantType": "TAILLE", "addedById": "string" }
// ]

// [
//   { "name": "Couleur", "value": "Noir", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Blanc", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Rouge", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Bleu", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Vert", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Jaune", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Gris", "price": 0, "variantType": "COULEUR", "addedById": "string" }
// ]

// [
//   { "name": "Couleur", "value": "Noir", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Blanc", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Rouge", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Bleu", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Vert", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Jaune", "price": 0, "variantType": "COULEUR", "addedById": "string" },
//   { "name": "Couleur", "value": "Gris", "price": 0, "variantType": "COULEUR", "addedById": "string" }
// ]

// [
//   { "name": "Capacité", "value": "16 Go", "price": 0, "variantType": "CAPACITE", "addedById": "string" },
//   { "name": "Capacité", "value": "32 Go", "price": 0, "variantType": "CAPACITE", "addedById": "string" },
//   { "name": "Capacité", "value": "64 Go", "price": 0, "variantType": "CAPACITE", "addedById": "string" },
//   { "name": "Capacité", "value": "128 Go", "price": 0, "variantType": "CAPACITE", "addedById": "string" },
//   { "name": "Capacité", "value": "256 Go", "price": 0, "variantType": "CAPACITE", "addedById": "string" },
//   { "name": "Capacité", "value": "512 Go", "price": 0, "variantType": "CAPACITE", "addedById": "string" },
//   { "name": "Capacité", "value": "1 To", "price": 0, "variantType": "CAPACITE", "addedById": "string" }
// ]

// [
//   { "name": "Poids", "value": "250 g", "price": 0, "variantType": "POIDS", "addedById": "string" },
//   { "name": "Poids", "value": "500 g", "price": 0, "variantType": "POIDS", "addedById": "string" },
//   { "name": "Poids", "value": "1 kg", "price": 0, "variantType": "POIDS", "addedById": "string" },
//   { "name": "Poids", "value": "1.5 kg", "price": 0, "variantType": "POIDS", "addedById": "string" },
//   { "name": "Poids", "value": "2 kg", "price": 0, "variantType": "POIDS", "addedById": "string" },
//   { "name": "Poids", "value": "5 kg", "price": 0, "variantType": "POIDS", "addedById": "string" }
// ]

// [
//   { "name": "Longueur", "value": "30 cm", "price": 0, "variantType": "LONGUEUR", "addedById": "string" },
//   { "name": "Longueur", "value": "50 cm", "price": 0, "variantType": "LONGUEUR", "addedById": "string" },
//   { "name": "Longueur", "value": "1 m", "price": 0, "variantType": "LONGUEUR", "addedById": "string" },
//   { "name": "Longueur", "value": "1.5 m", "price": 0, "variantType": "LONGUEUR", "addedById": "string" },
//   { "name": "Longueur", "value": "2 m", "price": 0, "variantType": "LONGUEUR", "addedById": "string" },
//   { "name": "Longueur", "value": "3 m", "price": 0, "variantType": "LONGUEUR", "addedById": "string" }
// ]

// [
//   { "name": "Largeur", "value": "10 cm", "price": 0, "variantType": "LARGEUR", "addedById": "string" },
//   { "name": "Largeur", "value": "20 cm", "price": 0, "variantType": "LARGEUR", "addedById": "string" },
//   { "name": "Largeur", "value": "50 cm", "price": 0, "variantType": "LARGEUR", "addedById": "string" },
//   { "name": "Largeur", "value": "1 m", "price": 0, "variantType": "LARGEUR", "addedById": "string" },
//   { "name": "Largeur", "value": "1.2 m", "price": 0, "variantType": "LARGEUR", "addedById": "string" },
//   { "name": "Largeur", "value": "1.5 m", "price": 0, "variantType": "LARGEUR", "addedById": "string" }
// ]
