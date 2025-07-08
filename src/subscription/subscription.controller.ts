import { Controller, Post, Get, Body, UseGuards, Req, Query, Param, Request as NestRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';
import { CreateServiceSubscriptionDto } from 'src/dto/request/service-subscription.dto';

@ApiTags('Subscription Api')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionController {

    constructor(private readonly subscriptionService: SubscriptionService) { }

    @UseGuards(JwtAuthGuard)
    @Post('subscribe')
    @ApiOperation({ summary: 'Souscrire à un service' })
    @ApiResponse({ status: 201, description: 'Souscription au service réussie' })
    async subscribeToService(@Req() req: any, @Body() dto: CreateServiceSubscriptionDto,) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.subscriptionService.subscribeToService(addedById, dto.serviceId,
            new Date(dto.startDate),
            new Date(dto.endDate),
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('cancel/:subscriptionId')
    @ApiOperation({ summary: 'Annuler une souscription avec remboursement partiel' })
    @ApiParam({ name: 'subscriptionId', description: 'ID de la souscription à annuler' })
    @ApiResponse({ status: 200, description: 'Souscription annulée avec remboursement partiel' })
    async cancelSubscription(@Req() req: any, @Param('subscriptionId') subscriptionId: string) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.subscriptionService.cancelSubscription(addedById, subscriptionId);
    }
    @UseGuards(JwtAuthGuard)
    @Get('my-subscriptions')
    @ApiOperation({ summary: 'Liste des souscriptions actives de l’utilisateur' })
    @ApiResponse({ status: 200, description: 'Liste des souscriptions actives récupérées' })
    async getUserSubscriptions(@Req() req: any) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.subscriptionService.getUserSubscriptions(addedById);
    }

    @UseGuards(JwtAuthGuard)
    @Get('all')
    @ApiOperation({ summary: 'Liste de toutes les souscriptions de l’utilisateur, sans filtre' })
    @ApiResponse({ status: 200, description: 'Toutes les souscriptions récupérées' })
    async getAllUserSubscriptions(@Req() req: any) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.subscriptionService.getAllUserSubscriptions(addedById);
    }

    @UseGuards(JwtAuthGuard)
    @Get('by-service-type')
    @ApiOperation({ summary: 'Souscriptions actives filtrées par type de service' })
    @ApiQuery({ name: 'type', required: true, description: 'Type de service (ex: livraison, restaurant, etc.)' })
    @ApiResponse({ status: 200, description: 'Souscriptions filtrées récupérées' })
    async getUserSubscriptionsByServiceType(
        @Req() req: any,
        @Query('type') type: string,) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.subscriptionService.getUserSubscriptionsByServiceType(addedById, type);
    }

    @UseGuards(JwtAuthGuard)
    @Get('expired')
    @ApiOperation({ summary: 'Souscriptions expirées de l’utilisateur' })
    @ApiQuery({ name: 'date', required: false, description: 'Date de référence au format ISO (par défaut : maintenant)',})
    @ApiResponse({ status: 200, description: 'Souscriptions expirées récupérées' })
    async getExpiredSubscriptions( @Req() req: any,@Query('date') date?: string,) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.subscriptionService.getExpiredSubscriptions(addedById, date ? new Date(date) : undefined);
    }

        @UseGuards(JwtAuthGuard)
    @Get('expiring-soon')
    @ApiOperation({ summary: 'Souscriptions expirant dans la semaine' })
    @ApiResponse({ status: 200, description: 'Souscriptions expirant bientôt récupérées' })
    async getSubscriptionsExpiringInAWeek( @Req() req: any,) {
        const user = req.user as any; // typage personnalisé si disponible
        const addedById = user?.userId;
        console.log(addedById);
        return this.subscriptionService.getSubscriptionsExpiringInAWeek(addedById);
    }
}
