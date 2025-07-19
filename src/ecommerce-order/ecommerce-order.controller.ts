import { EcommerceOrderService } from './ecommerce-order.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateEcommerceOrderDto } from 'src/dto/request/ecommerce-order.dto';
import {Controller,Post,Body,Req,UseGuards,Get,Param,Delete,NotFoundException,UnauthorizedException,Patch, Query} from '@nestjs/common';
import { UpdateOrderStatusDto } from 'src/dto/request/update-order-status.dto';
import { Request } from 'express';
import { UserOrTokenAuthGuard } from 'src/guards/user-or-token.guard';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { OrderStatus } from '@prisma/client';

@ApiTags('EcommerceOrders')
@ApiBearerAuth('access-token')

@Controller('ecommerce-order')
export class EcommerceOrderController {
    constructor(private readonly ecommerceOrderService: EcommerceOrderService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer une commande e-commerce' })
    @ApiResponse({ status: 201, description: 'Commande créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Données invalides.' })
    async createOrder(@Body() dto: CreateEcommerceOrderDto,@Req() req: Request,) {
        const user = req.user as any;
        if (!user.userId) {
            throw new UnauthorizedException('Utilisateur non authentifié');
        }
        return this.ecommerceOrderService.createOrder(dto, user.userId);
    }


    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les commandes e-commerce' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAll( @Query() pagination: PaginationParamsDto) {
        return this.ecommerceOrderService.getAllOrders(pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une commande par ID' })
    @ApiResponse({ status: 200, description: 'Commande récupérée avec succès.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    async getById(@Param('id') id: string) {
        const order = await this.ecommerceOrderService.getOrderById(id);
        if (!order) throw new NotFoundException('Commande non trouvée');
        return order;
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/me')
    @ApiOperation({ summary: 'Récupérer les commandes de l’utilisateur connecté' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getByUser(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.ecommerceOrderService.getOrdersByUserId(user.userId, pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('creator/orders/me')
    @ApiOperation({ summary: 'Commandes contenant des produits créés par l’utilisateur connecté' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getOrdersByCreator(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.ecommerceOrderService.getOrdersByProductCreator(user.userId, pagination);
    }


    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une commande e-commerce' })
    @ApiResponse({ status: 200, description: 'Commande supprimée avec succès.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    async delete(@Param('id') id: string,  @Req() req: Request,) {
        const user = req.user as any;
        return this.ecommerceOrderService.deleteOrder(id, user.userId);
    }


    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Annuler une commande e-commerce' })
    @ApiResponse({ status: 200, description: 'Commande annulée avec succès.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    async cancelOrder(@Param('id') id: string,  @Req() req: Request,) {
        const user = req.user as any;
        return this.ecommerceOrderService.cancelOrder(id, user.userId);
    }

    // @Patch(':id/status/:status')
    // @ApiOperation({ summary: 'Mettre à jour le statut d’une commande' })
    // @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès.' })
    // @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    // async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto,@Req() req: Request,) {
    //     const user = req.user as any;
    //     return this.ecommerceOrderService.updateOrderStatus(id, dto.status,user.userId);
    // }


    @UseGuards(JwtAuthGuard)
    @Patch(':id/status/:status')
    @ApiOperation({ summary: 'Mettre à jour le statut d’une commande' })
    @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    async updateStatus(
        @Param('id') id: string,
        @Param('status') status: OrderStatus,
        @Req() req: Request,) {
        const user = req.user as any;
        console.log('USER:', user);
        return this.ecommerceOrderService.updateOrderStatus(id, status, user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/orders-gains')
    @ApiOperation({ summary: 'Statistiques globales des commandes et gains' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    async getOrderStatsAndGains() {
        return this.ecommerceOrderService.getOrderStatsAndGains();
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/orders-revenue')
    @ApiOperation({ summary: 'Statistiques des commandes et revenus par mois' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date de début (ex: 2024-08-01)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date de fin (ex: 2025-07-01)' })
    @ApiResponse({ status: 200, description: 'Graphiques commandes/revenus retournés.' })
    async getOrdersAndRevenueStats( @Query('startDate') startDate?: string, @Query('endDate') endDate?: string,) {
        return this.ecommerceOrderService.getOrdersAndRevenueStats(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

}
