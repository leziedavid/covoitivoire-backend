import {Controller,Get,Param,Query,Req,UseGuards,BadRequestException,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { TransactionService } from './transaction.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { TransactionType } from '@prisma/client';
import { Request } from 'express';


@ApiTags('💰 Transactions Api')
@ApiBearerAuth('access-token')
@Controller('transactions')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une transaction par ID' })
    @ApiResponse({ status: 200, description: 'Transaction retournée.' })
    @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
    async getTransactionById(@Param('id') id: string) {
        return this.transactionService.getTransactionById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste paginée de toutes les transactions (admin)' })
    @ApiResponse({ status: 200, description: 'Liste paginée retournée.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllTransactions(@Query() pagination: PaginationParamsDto) {
        return this.transactionService.getAllTransactions(pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/me')
    @ApiOperation({ summary: "Transactions paginées de l'utilisateur connecté" })
    @ApiResponse({ status: 200, description: 'Transactions utilisateur retournées.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getMyTransactions(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.transactionService.getTransactionsByUser( user.userId, pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/:userId')
    @ApiOperation({ summary: "Transactions paginées d'un utilisateur par ID" })
    @ApiResponse({ status: 200, description: 'Transactions utilisateur retournées.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getTransactionsByUserId(
        @Param('userId') userId: string,
        @Query() pagination: PaginationParamsDto,
    ) {
        return this.transactionService.getTransactionsByUser(userId, pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('wallet/:walletId')
    @ApiOperation({ summary: "Transactions paginées d'un wallet par ID" })
    @ApiResponse({ status: 200, description: 'Transactions wallet retournées.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getTransactionsByWallet(
        @Param('walletId') walletId: string,
        @Query() pagination: PaginationParamsDto,
    ) {
        return this.transactionService.getTransactionsByWallet(walletId, pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('number/:transactionNumber')
    @ApiOperation({ summary: 'Récupérer une transaction par numéro unique' })
    @ApiResponse({ status: 200, description: 'Transaction retournée.' })
    @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
    async getTransactionByNumber(@Param('transactionNumber') transactionNumber: string) {
        return this.transactionService.getTransactionByNumber(transactionNumber);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/global')
    @ApiOperation({ summary: 'Statistiques globales des transactions' })
    @ApiResponse({ status: 200, description: 'Statistiques retournées.' })
    async getGlobalTransactionStats() {
        return this.transactionService.getGlobalTransactionStats();
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/user/me')
    @ApiOperation({ summary: "Statistiques des transactions de l'utilisateur connecté" })
    @ApiResponse({ status: 200, description: 'Statistiques utilisateur retournées.' })
    async getUserTransactionStats(@Req() req: Request,) {
        const user = req.user as any;
        return this.transactionService.getUserTransactionStats(user.userId, );
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/monthly')
    @ApiOperation({ summary: 'Statistiques mensuelles des transactions Admin' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date de début (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date de fin (YYYY-MM-DD)' })
    @ApiResponse({ status: 200, description: 'Statistiques mensuelles retournées.' })
    async getMonthlyTransactionStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.transactionService.getMonthlyAdminTransactionStats(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }



    @UseGuards(JwtAuthGuard)
    @Get('stats/monthly/user')
    @ApiOperation({ summary: 'Statistiques mensuelles des transaction utilisateur connecté' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date de début (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date de fin (YYYY-MM-DD)' })
    @ApiResponse({ status: 200, description: 'Statistiques mensuelles retournées.' })
    async getMonthlyTransactionStatsByUser(@Req() req: Request, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string,) {
        const user = req.user as any;
        return this.transactionService.getMonthlyTransactionStatsByUser(
            user.userId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }



}
