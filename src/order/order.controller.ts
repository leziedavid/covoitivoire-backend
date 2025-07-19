import {Controller,Post,Param,Body,Delete,Patch,Get,Query, Req, UseGuards,} from '@nestjs/common';
import { OrderService } from './order.service';
import {ApiTags,ApiOperation,ApiBearerAuth,ApiResponse,} from '@nestjs/swagger';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';


@Controller('order')
@ApiTags('Commandes')
@ApiBearerAuth('access-token')
@ApiBearerAuth()
export class OrderController {
    constructor(private readonly orderService: OrderService) { }


    @UseGuards(JwtAuthGuard)
    @Post('create/:tripId')
    @ApiOperation({ summary: 'Créer une commande sur un trajet' })
    @ApiResponse({ status: 201, description: 'Commande créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Place non disponible ou erreur de validation.' })
    @ApiResponse({ status: 404, description: 'Trajet introuvable.' })
    @ApiResponse({ status: 403, description: 'Action interdite, seul le chauffeur peut réserver.' })
    createOrder(
        @Param('tripId') tripId: string,
        @Req() req: Request) {
        const user = req.user as any;
        return this.orderService.createOrder(user.userId, tripId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('cancel/:orderId')
    @ApiOperation({ summary: 'Annuler une commande' })
    @ApiResponse({ status: 200, description: 'Commande annulée avec succès.' })
    @ApiResponse({ status: 400, description: 'Impossible d’annuler cette commande.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    cancelOrder(@Param('orderId') orderId: string, @Req() req: Request, ) {
        const user = req.user as any;
        return this.orderService.cancelOrder(user.userId, orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('validate/:orderId')
    @ApiOperation({ summary: 'Valider une commande (chauffeur)' })
    @ApiResponse({ status: 200, description: 'Commande validée avec succès.' })
    @ApiResponse({ status: 403, description: 'Action interdite, seul le chauffeur peut valider.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    validateOrder(@Param('orderId') orderId: string,@Req() req: Request,) {
        const user = req.user as any;
        return this.orderService.validateOrder(user.userId, orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('complete/:orderId')
    @ApiOperation({ summary: 'Terminer une commande (chauffeur)' })
    @ApiResponse({ status: 200, description: 'Commande terminée avec succès.' })
    @ApiResponse({ status: 403, description: 'Action interdite, seul le chauffeur peut terminer.' })
    @ApiResponse({ status: 404, description: 'Commande introuvable.' })
    completeOrder(@Param('orderId') orderId: string, @Req() req: Request,) {
        const user = req.user as any;
        return this.orderService.completeOrder(user.userId, orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/driver/:driverId')
    @ApiOperation({ summary: 'Obtenir les statistiques d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getDriverStats( @Req() req: Request,) {
        const user = req.user as any;
        return this.orderService.getDriverStats(user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/partner/:partnerId')
    @ApiOperation({ summary: 'Obtenir les statistiques d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getPartnerStats( @Req() req: Request,) {
        const user = req.user as any;
        return this.orderService.getPartnerStats(user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/:userId/all')
    @ApiOperation({ summary: 'Obtenir toutes les commandes d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getAllOrdersByUser(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getAllOrdersByUser(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/:userId/today')
    @ApiOperation({ summary: 'Obtenir les commandes du jour d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getTodayOrdersByUser(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getTodayOrdersByUser(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/:userId/canceled')
    @ApiOperation({ summary: 'Obtenir les commandes annulées d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getCanceledOrdersByUser(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getCanceledOrdersByUser(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/:userId/validated')
    @ApiOperation({ summary: 'Obtenir les commandes validées d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
    getValidatedOrdersByUser(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getValidatedOrdersByUser(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('driver/:driverId/all')
    @ApiOperation({ summary: 'Obtenir toutes les commandes d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getAllOrdersByDriver(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getAllOrdersByDriver(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('driver/:driverId/today')
    @ApiOperation({ summary: 'Obtenir les commandes du jour d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getTodayOrdersByDriver(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getTodayOrdersByDriver(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('driver/:driverId/canceled')
    @ApiOperation({ summary: 'Obtenir les commandes annulées d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getCanceledOrdersByDriver(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getCanceledOrdersByDriver(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('driver/:driverId/validated')
    @ApiOperation({ summary: 'Obtenir les commandes validées d’un chauffeur' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Chauffeur introuvable.' })
    getValidatedOrdersByDriver(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getValidatedOrdersByDriver(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('partner/:partnerId/all')
    @ApiOperation({ summary: 'Obtenir toutes les commandes d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getAllOrdersByPartner(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getAllOrdersByPartner(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('partner/:partnerId/today')
    @ApiOperation({ summary: 'Obtenir les commandes du jour d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getTodayOrdersByPartner(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getTodayOrdersByPartner(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('partner/:partnerId/canceled')
    @ApiOperation({ summary: 'Obtenir les commandes annulées d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getCanceledOrdersByPartner(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getCanceledOrdersByPartner(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('partner/:partnerId/validated')
    @ApiOperation({ summary: 'Obtenir les commandes validées d’un partenaire' })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    @ApiResponse({ status: 404, description: 'Partenaire introuvable.' })
    getValidatedOrdersByPartner(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.orderService.getValidatedOrdersByPartner(user.userId,pagination);
    }

}
