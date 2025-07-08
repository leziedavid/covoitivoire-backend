import {Controller,Get,Query,UseGuards,Req,ForbiddenException,} from '@nestjs/common';
import {ApiTags,ApiOperation,ApiResponse,ApiBearerAuth,} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { StatisticsService } from './statistics.service';
import { StatsFilterDto } from 'src/dto/request/stats-filter.dto';
import { Role } from '@prisma/client';

@ApiTags('Statistiques')
@ApiBearerAuth('access-token')
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: '📊 Récupérer les statistiques selon le rôle' })
    @ApiResponse({status: 200,description: 'Statistiques récupérées selon le rôle de l’utilisateur',})
    async getStatistics(@Req() req, @Query() dto: StatsFilterDto) {
        const user = req.user;
        const userId = user?.userId;
        const userRole = user?.role;
        
        if (!userId || !userRole) {
            throw new ForbiddenException('Utilisateur non autorisé');
        }

        if (userRole === Role.ADMIN) {
            // Si admin, appel stats admin
            return this.statisticsService.getAdminStatistics(dto);
        } else {
            // Sinon, stats user avec userId
            return this.statisticsService.getUserStatistics(userId, dto);
        }
    }
}
