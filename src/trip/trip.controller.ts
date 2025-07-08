import {Controller,Post,Get,Patch,Delete,Body,UseGuards,Param,Query,} from '@nestjs/common';
import {ApiTags,ApiOperation,ApiResponse,ApiBearerAuth, ApiQuery,} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { TripService } from './trip.service';
import { CreateTripDto, UpdateTripDto } from 'src/dto/request/trip.dto';
import { SearchTripDto } from 'src/dto/request/search-trip.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { TripStatus } from '@prisma/client';
import { UpdateTripStatusDto } from 'src/dto/request/update-trip-status.dto';

@ApiTags('🚗 trajets Api')
@ApiBearerAuth('access-token')
@Controller('trips')
export class TripController {
    constructor(private readonly tripService: TripService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau trajet' })
    @ApiResponse({ status: 201, description: 'Trajet créé avec succès.' })
    @ApiResponse({ status: 400, description: 'Aucun conducteur assigné.' })
    @ApiResponse({ status: 404, description: 'Véhicule introuvable.' })
    async createTrip(@Body() dto: CreateTripDto) {
        return this.tripService.createTrip(dto);
    }

    // @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un trajet par ID' })
    @ApiResponse({ status: 200, description: 'Détails du trajet retournés.' })
    @ApiResponse({ status: 404, description: 'Trajet non trouvé.' })
    async getTripById(@Param('id') id: string) {
        return this.tripService.getTripById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un trajet' })
    @ApiResponse({ status: 200, description: 'Trajet mis à jour.' })
    @ApiResponse({ status: 404, description: 'Trajet non trouvé.' })
    async updateTrip(@Param('id') id: string, @Body() dto: UpdateTripDto) {
        return this.tripService.updateTrip(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un trajet' })
    @ApiResponse({ status: 200, description: 'Trajet supprimé avec succès.' })
    @ApiResponse({ status: 404, description: 'Trajet non trouvé.' })
    async deleteTrip(@Param('id') id: string) {
        return this.tripService.deleteTrip(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':tripId/status')
    @ApiOperation({ summary: 'Mettre à jour le statut d’un trajet' })
    @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès.' })
    @ApiResponse({ status: 400, description: 'Statut invalide ou modification interdite.' })
    @ApiResponse({ status: 404, description: 'Trajet non trouvé.' })
    async updateTripStatus( @Param('tripId') tripId: string, @Body() body: UpdateTripStatusDto,) {
        return this.tripService.updateTripStatus(tripId, body.status);
    }



    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste de tous les trajets' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des trajets retournée.' })
    async getAllTrips(@Query() params: PaginationParamsDto) {
        return this.tripService.getAllTrips(params);
    }

    @UseGuards(JwtAuthGuard)
    @Get('by-vehicle/:vehicleId')
    @ApiOperation({ summary: 'Liste des trajets d’un véhicule' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des trajets retournée.' })
    async getTripsByVehicle(
        @Param('vehicleId') vehicleId: string,
        @Query() params: PaginationParamsDto,
    ) {
        return this.tripService.getTripsByVehicle(vehicleId, params);
    }

    @UseGuards(JwtAuthGuard)
    @Get('by-driver/:driverId')
    @ApiOperation({ summary: 'Liste des trajets d’un conducteur' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des trajets retournée.' })
    async getTripsByDriver(
        @Param('driverId') driverId: string,
        @Query() params: PaginationParamsDto,
    ) {
        return this.tripService.getTripsByDriver(driverId, params);
    }

    @ApiTags('🚗 Recherche')
    @Post('search')
    @ApiOperation({ summary: 'Rechercher des trajets selon des critères géographiques et temporels',})
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Trajets trouvés.' })
    @ApiResponse({ status: 404, description: 'Aucun trajet trouvé.' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur.' })
    async searchTrips(
        @Body() dto: SearchTripDto,
        @Query() pagination: PaginationParamsDto,
    ) {
        return this.tripService.searchTrips({ ...dto, ...pagination });
    }

}


