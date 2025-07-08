// src/delivery/delivery.controller.ts
import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
    Req, Query
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from 'src/dto/request/delivery.dto';
import { DeliveryStatus } from '@prisma/client';

@ApiTags('Livraisons')
@ApiBearerAuth('access-token')
@Controller('deliveries')
export class DeliveryController {
    constructor(private readonly deliveryService: DeliveryService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: '📦 Créer une livraison' })
    @ApiResponse({ status: 201, description: 'Livraison créée avec succès' })
    async create(@Body() dto: CreateDeliveryDto, @Req() req) {
        const userId = req.user.id;
        return this.deliveryService.createDelivery(dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: '🔍 Récupérer une livraison par ID' })
    @ApiResponse({ status: 200, description: 'Livraison récupérée' })
    @ApiResponse({ status: 404, description: 'Livraison introuvable' })
    async getById(@Param('id') id: string) {
        return this.deliveryService.getDeliveryById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: '✏️ Mettre à jour une livraison' })
    @ApiResponse({ status: 200, description: 'Livraison mise à jour' })
    @ApiResponse({ status: 404, description: 'Livraison introuvable' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateDeliveryDto,
        @Req() req
    ) {
        const userId = req.user.id;
        return this.deliveryService.updateDelivery(id, dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: '❌ Supprimer une livraison' })
    @ApiResponse({ status: 200, description: 'Livraison supprimée' })
    @ApiResponse({ status: 404, description: 'Livraison introuvable' })
    async delete(@Param('id') id: string, @Req() req) {
        const userId = req.user.id;
        return this.deliveryService.deleteDelivery(id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('service/:serviceId')
    @ApiOperation({ summary: '📋 Lister les livraisons d’un service' })
    @ApiResponse({ status: 200, description: 'Liste des livraisons' })
    async getByService(@Param('serviceId') serviceId: string) {
        return this.deliveryService.getDeliveriesByService(serviceId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    @ApiOperation({ summary: '🔄 Mettre à jour le statut d’une livraison' })
    @ApiQuery({ name: 'status', enum: DeliveryStatus })
    @ApiResponse({ status: 200, description: 'Statut mis à jour' })
    async updateStatus(
        @Param('id') id: string,
        @Query('status') status: DeliveryStatus,
        @Req() req
    ) {
        const userId = req.user.id;
        return this.deliveryService.updateDeliveryStatus(id, status, userId);
    }
}
