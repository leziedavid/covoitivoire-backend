import {Controller,Post,Param,Body,Delete,Patch,Get,Query,} from '@nestjs/common';
import { OrderService } from './order.service';
import {ApiTags,ApiOperation,ApiBearerAuth,ApiResponse,} from '@nestjs/swagger';

@Controller('order')
@ApiTags('Commandes')
@ApiBearerAuth()
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post('create/:tripId')
    @ApiOperation({ summary: 'Créer une commande sur un trajet' })
    @ApiResponse({ status: 201, description: 'Commande créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Place non disponible ou erreur de validation.' })
    @ApiResponse({ status: 404, description: 'Trajet introuvable.' })
    @ApiResponse({ status: 403, description: 'Action interdite, seul le chauffeur peut réserver.' })
    createOrder(@Param('tripId') tripId: string, @Query('userId') userId: string) {
        return this.orderService.createOrder(userId, tripId);
    }

    @Patch('cancel/:orderId')
    @ApiOperation({ summary: 'Annuler une commande' })
    @ApiResponse({ status: 200, description: 'Commande annulée avec succès.' })
    @ApiResponse({ status: 400, description: 'Impossible d’annuler cette commande.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    cancelOrder(@Param('orderId') orderId: string, @Query('userId') userId: string) {
        return this.orderService.cancelOrder(userId, orderId);
    }

    @Patch('validate/:orderId')
    @ApiOperation({ summary: 'Valider une commande (chauffeur)' })
    @ApiResponse({ status: 200, description: 'Commande validée avec succès.' })
    @ApiResponse({ status: 403, description: 'Action interdite, seul le chauffeur peut valider.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    validateOrder(@Param('orderId') orderId: string, @Query('driverId') driverId: string) {
        return this.orderService.validateOrder(driverId, orderId);
    }

    @Patch('complete/:orderId')
    @ApiOperation({ summary: 'Terminer une commande (chauffeur)' })
    @ApiResponse({ status: 200, description: 'Commande terminée avec succès.' })
    @ApiResponse({ status: 403, description: 'Action interdite, seul le chauffeur peut terminer.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    completeOrder(@Param('orderId') orderId: string, @Query('driverId') driverId: string) {
        return this.orderService.completeOrder(driverId, orderId);
    }

    @Get('stats/driver/:driverId')
    @ApiOperation({ summary: 'Obtenir les statistiques d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getDriverStats(@Param('driverId') driverId: string) {
        return this.orderService.getDriverStats(driverId);
    }

    @Get('stats/partner/:partnerId')
    @ApiOperation({ summary: 'Obtenir les statistiques d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getPartnerStats(@Param('partnerId') partnerId: string) {
        return this.orderService.getPartnerStats(partnerId);
    }

    @Get('user/:userId/all')
    @ApiOperation({ summary: 'Obtenir toutes les commandes d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getAllOrdersByUser(@Param('userId') userId: string) {
        return this.orderService.getAllOrdersByUser(userId);
    }

    @Get('user/:userId/today')
    @ApiOperation({ summary: 'Obtenir les commandes du jour d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getTodayOrdersByUser(@Param('userId') userId: string) {
        return this.orderService.getTodayOrdersByUser(userId);
    }

    @Get('user/:userId/canceled')
    @ApiOperation({ summary: 'Obtenir les commandes annulées d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getCanceledOrdersByUser(@Param('userId') userId: string) {
        return this.orderService.getCanceledOrdersByUser(userId);
    }

    @Get('user/:userId/validated')
    @ApiOperation({ summary: 'Obtenir les commandes validées d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getValidatedOrdersByUser(@Param('userId') userId: string) {
        return this.orderService.getValidatedOrdersByUser(userId);
    }

    @Get('driver/:driverId/all')
    @ApiOperation({ summary: 'Obtenir toutes les commandes d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getAllOrdersByDriver(@Param('driverId') driverId: string) {
        return this.orderService.getAllOrdersByDriver(driverId);
    }

    @Get('driver/:driverId/today')
    @ApiOperation({ summary: 'Obtenir les commandes du jour d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getTodayOrdersByDriver(@Param('driverId') driverId: string) {
        return this.orderService.getTodayOrdersByDriver(driverId);
    }

    @Get('driver/:driverId/canceled')
    @ApiOperation({ summary: 'Obtenir les commandes annulées d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getCanceledOrdersByDriver(@Param('driverId') driverId: string) {
        return this.orderService.getCanceledOrdersByDriver(driverId);
    }

    @Get('driver/:driverId/validated')
    @ApiOperation({ summary: 'Obtenir les commandes validées d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getValidatedOrdersByDriver(@Param('driverId') driverId: string) {
        return this.orderService.getValidatedOrdersByDriver(driverId);
    }

    @Get('partner/:partnerId/all')
    @ApiOperation({ summary: 'Obtenir toutes les commandes d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getAllOrdersByPartner(@Param('partnerId') partnerId: string) {
        return this.orderService.getAllOrdersByPartner(partnerId);
    }

    @Get('partner/:partnerId/today')
    @ApiOperation({ summary: 'Obtenir les commandes du jour d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getTodayOrdersByPartner(@Param('partnerId') partnerId: string) {
        return this.orderService.getTodayOrdersByPartner(partnerId);
    }

    @Get('partner/:partnerId/canceled')
    @ApiOperation({ summary: 'Obtenir les commandes annulées d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getCanceledOrdersByPartner(@Param('partnerId') partnerId: string) {
        return this.orderService.getCanceledOrdersByPartner(partnerId);
    }

    @Get('partner/:partnerId/validated')
    @ApiOperation({ summary: 'Obtenir les commandes validées d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getValidatedOrdersByPartner(@Param('partnerId') partnerId: string) {
        return this.orderService.getValidatedOrdersByPartner(partnerId);
    }
}
