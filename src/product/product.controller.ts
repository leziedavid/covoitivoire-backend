import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Param, UploadedFiles, UseInterceptors, Query, UploadedFile, Req, } from '@nestjs/common';
import { FilesInterceptor, FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiBody, ApiQuery, } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateProductDto, UpdateProductDto, } from 'src/dto/request/product.dto';
import { ProductService } from './product.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { Request } from 'express';

@ApiTags('📦 Products Api')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductController {

    constructor(private readonly productService: ProductService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau produit' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'imageFile', maxCount: 1 },
            { name: 'files', maxCount: 10 },
        ])
    )
    @ApiBody({ description: 'Données pour créer un produit avec fichiers', type: CreateProductDto, })
    @ApiResponse({ status: 201, description: 'Produit créé avec succès.' })
    async createProduct(
        @UploadedFiles() files: { files?: Express.Multer.File[]; imageFile?: Express.Multer.File[]; },
        @Body() dto: CreateProductDto,
        @Req() req: Request,
    ) {
        dto.imageFile = files.imageFile?.[0] ?? null;
        dto.files = files.files ?? null;
        const user = req.user as any;
        return this.productService.createProduct(dto, user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un produit par ID' })
    @ApiResponse({ status: 200, description: 'Détails du produit retournés.' })
    @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
    async getProductById(@Param('id') id: string) {
        return this.productService.getProductById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un produit' })
    @ApiConsumes('multipart/form-data')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'imageFile', maxCount: 1 },
            { name: 'files', maxCount: 10 },
        ])
    )
    @ApiBody({ description: 'Données pour mettre à jour un produit avec fichiers', type: UpdateProductDto, })
    @ApiResponse({ status: 200, description: 'Produit mis à jour.' })
    @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
    async updateProduct(@Param('id') id: string, @UploadedFiles() files: { files?: Express.Multer.File[]; imageFile?: Express.Multer.File[]; },
        @Body() dto: UpdateProductDto,
        @Req() req,
    ) {
        dto.imageFile = files.imageFile?.[0] ?? null;
        dto.files = files.files ?? null;
        const userId = req.user?.id;
        return this.productService.updateProduct(id, dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un produit' })
    @ApiResponse({ status: 200, description: 'Produit supprimé.' })
    @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
    async deleteProduct(@Param('id') id: string, @Req() req) {
        const userId = req.user?.id;
        return this.productService.deleteProduct(id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste des produits d’un service' })
    @ApiResponse({ status: 200, description: 'Liste des produits retournée.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getProductsByService(@Query('serviceId') serviceId: string, @Query() pagination: PaginationParamsDto) {
        return this.productService.getProductsByService(serviceId, pagination);
    }

    // @UseGuards(JwtAuthGuard)
    @Get('valid/all')
    @ApiOperation({ summary: 'Tous les produits valides (non expirés)' })
    @ApiResponse({ status: 200, description: 'Produits valides retournés.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllValidProducts(@Query() pagination: PaginationParamsDto) {
        return this.productService.getAllValidProducts(pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('valid/user')
    @ApiOperation({ summary: 'Produits valides pour l’utilisateur connecté' })
    @ApiResponse({ status: 200, description: 'Produits utilisateur retournés.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getUserValidProducts(@Req() req, @Query() pagination: PaginationParamsDto) {
        const userId = req.user?.id;
        return this.productService.getUserValidProducts(userId, pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/all')
    @ApiOperation({ summary: 'Tous les produits (admin)' })
    @ApiResponse({ status: 200, description: 'Tous les produits retournés.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllProductsAdmin(@Query() pagination: PaginationParamsDto,) {
        return this.productService.getAllProductsAdmin(pagination);
    }

    // 1 Statistiques des produits pour l’utilisateur connecté

    @UseGuards(JwtAuthGuard)
    @Get('me/stats')
    @ApiOperation({ summary: 'Statistiques des produits de l’utilisateur connecté' })
    @ApiResponse({ status: 200, description: 'Statistiques utilisateur retournées.' })
    async getUserProductStats(@Req() req) {
        const userId = req.user?.id;
        return this.productService.getUserProductStats(userId);
    }

    // 2. Statistiques globales (admin – pas besoin de userId)
    @UseGuards(JwtAuthGuard)
    @Get('admin/stats')
    @ApiOperation({ summary: 'Statistiques globales des produits (admin)' })
    @ApiResponse({ status: 200, description: 'Statistiques globales retournées.' })
    async getGlobalProductStats() {
        return this.productService.getGlobalProductStats();
    }

    // 3. Graphe des commandes + revenus (admin avec période)

    @UseGuards(JwtAuthGuard)
    @Get('admin/stats/orders-revenue')
    @ApiOperation({ summary: 'Graphiques des commandes et revenus par mois' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date de début (ex: 2024-08-01)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date de fin (ex: 2025-07-01)' })
    @ApiResponse({ status: 200, description: 'Graphiques commandes/revenus retournés.' })
    async getOrdersAndRevenueStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.productService.getOrdersAndRevenueStats(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }





}


// {
//   "name": "CHAUSSURE DE SPORT HOMME",
//   "description": "Chaussures légères et respirantes idéales pour le sport ou les sorties décontractées.",
//   "price": 49.99,
//   "stock": 120,
//   "sku": "CHSP-001-BLEU-42",
//   "imageUrl": "https://res.cloudinary.com/ton_cloud/image/upload/v1234567890/products/image_principale.jpg",
//   "categoryId": "e3f5b82a-57ad-4b35-95c7-13e3c3d08765",
//   "serviceId": "cfda91c9-38e7-4f19-b3a3-2b7db9f11a99",
//   "variantIds": [
//     "8c02f2ba-bf37-4411-a7df-84d4a05c60e2", // Pointure 42
//     "41e3bfe1-e79e-4dc8-879c-b66a60c73f67"  // Couleur Bleu
//   ]
// }


// curl -X 'POST' \
//   'http://localhost:4000/api/products' \
//   -H 'accept: */*' \
//   -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZTEyNmVmMy0xZTViLTQ0ODQtYmUzMi1kOGM5ZjgzOTkyZTIiLCJyb2xlIjoiUEFSVE5FUiIsInN0YXR1cyI6IkFDVElWRSIsIm5hbWUiOiJKb2huIERvZSIsImltYWdlVXJsIjoiaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHRha2JmM2hhL2ltYWdlL3VwbG9hZC92MTc0OTkzMTM5Ny91c2Vycy9jMTZhMTRiZC02NDIwLTQ1ZDEtOWYwOC0xZWM5MTNmMWMxY2MucG5nIiwicGFydG5lcklkIjpudWxsLCJpYXQiOjE3NTA0NjQ0MzYsImV4cCI6MTc1MDQ2NTMzNn0.6jGX52RPYncNVahS02cbx5TlMhUHfRgdNUyvtFlls6g' \
//   -H 'Content-Type: multipart/form-data' \
//   -F 'price=10000' \
//   -F 'name=CHAUSSURE DE SPORT HOMME' \
//   -F 'serviceId=1a13cacf-ce8b-4bb4-85c1-671f5c7cad49' \
//   -F 'variantIds=13f57d68-04c6-43b0-9f90-0aaed51b8eea' \
//   -F 'stock=4' \
//   -F 'imageFile=@IMG_5195.png;type=image/png' \
//   -F 'files=@IMG_5195.png;type=image/png' \
//   -F 'categoryId=836d9593-bd7b-4e2b-b6ed-da61598b24f3' \
//   -F 'description=Chaussures légères et respirantes idéales pour le sport ou les sorties décontractées.' \
//   -F 'sku=PUMA'
