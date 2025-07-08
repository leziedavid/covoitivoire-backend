import {
    Controller, Post, Get, Patch, Delete, Body, UseGuards, Param,
    UploadedFile, UseInterceptors, Req, Query} from '@nestjs/common';
import {
    FileInterceptor
} from '@nestjs/platform-express';
import {
    ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiBody, ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateVehicleDto, UpdateVehicleDto } from 'src/dto/request/vehicle.dto';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { Request } from 'express';

@ApiTags('🚗 Vehicules Api')
@ApiBearerAuth('access-token')
@Controller('vehicles')
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    @Post()
    @ApiOperation({ summary: 'Créer un nouveau véhicule' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiBody({ description: 'Données pour créer un véhicule avec fichiers', type: CreateVehicleDto })
    @ApiResponse({ status: 201, description: 'Véhicule créé avec succès.' })
    async createVehicle(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateVehicleDto) {
        dto.file = file;
        dto.capacity = Number(dto.capacity);
        return this.vehicleService.createVehicle(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un véhicule par ID' })
    @ApiResponse({ status: 200, description: 'Détails du véhicule retournés.' })
    @ApiResponse({ status: 404, description: 'Véhicule non trouvé.' })
    async getVehicleById(@Param('id') id: string) {
        return this.vehicleService.getVehicleById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un véhicule' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiBody({ description: 'Données pour mettre à jour un véhicule avec fichiers', type: UpdateVehicleDto })
    @ApiResponse({ status: 200, description: 'Véhicule mis à jour.' })
    @ApiResponse({ status: 404, description: 'Véhicule non trouvé.' })
    async updateVehicle(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UpdateVehicleDto,
    ) {
        dto.file = file;
        dto.capacity = Number(dto.capacity);
        return this.vehicleService.updateVehicle(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un véhicule' })
    @ApiResponse({ status: 200, description: 'Véhicule supprimé.' })
    @ApiResponse({ status: 404, description: 'Véhicule non trouvé.' })
    async deleteVehicle(@Param('id') id: string) {
        return this.vehicleService.deleteVehicle(id);
    }

    // 🔹 1. Véhicules d’un partenaire (sans pagination)
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste des véhicules d’un partenaire (sans pagination)' })
    @ApiResponse({ status: 200, description: 'Liste des véhicules retournée.' })
    async getVehiclesByPartner(@Req() req: Request) {
        const user = req.user as any;
        return this.vehicleService.getVehiclesByPartner(user.userId);
    }

    // 🔹 2. Véhicules d’un partenaire (avec pagination)
    @UseGuards(JwtAuthGuard)
    @Get('by-partner/:vehicleId')
    @ApiOperation({ summary: 'Liste des véhicules d’un partenaire (avec pagination)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des véhicules paginée retournée.' })
    async getAllVehiclesByPartner( @Req() req: Request, @Query() pagination: PaginationParamsDto,) {
        const user = req.user as any;
        return this.vehicleService.getAllVehiclesByPartner(user.userId, pagination);
    }

    // 🔹 3. Tous les véhicules (avec pagination)
    @UseGuards(JwtAuthGuard)
    @Get('all')
    @ApiOperation({ summary: 'Liste paginée de tous les véhicules' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste de tous les véhicules paginée retournée.' })
    async getAllVehicles(@Query() pagination: PaginationParamsDto) {
        return this.vehicleService.getAllVehicles(pagination);
    }

    // 🔹 4. Véhicules avec conducteurs (filtré par partenaire)
    @UseGuards(JwtAuthGuard)
    @Get('with-drivers/all')
    @ApiOperation({ summary: 'Liste des véhicules avec leurs conducteurs (filtré par partenaire)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des véhicules avec conducteurs retournée.' })
    async getVehiclesWithDrivers(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        console.log("User ID:", user.userId);
        return this.vehicleService.getVehiclesWithDrivers(user.userId, pagination);
    }
}
