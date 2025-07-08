import {WebSocketGateway,WebSocketServer,OnGatewayConnection,OnGatewayDisconnect,} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService, ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token;
            if (!token) throw new Error('Token manquant');

            const payload = this.jwtService.verify(token);

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    role: true,
                    partnerId: true,
                },
            });

            if (!user) throw new Error('Utilisateur non trouvé');
            if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
                throw new Error('Compte inactif ou bloqué');
            }

            client.data.user = user;
            client.join(`user_${user.id}`);
            Logger.log(`✅ ${user.name} connecté via WebSocket`);
        } catch (err) {
            Logger.warn('❌ Connexion WebSocket refusée : ' + err.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const user = client.data?.user;
        Logger.log(`⛔ Déconnexion : ${user?.name || 'Inconnu'}`);
    }

    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user_${userId}`).emit(event, data);
    }

    sendToTrip(tripId: string, event: string, data: any) {
        this.server.to(`trip_${tripId}`).emit(event, data);
    }

}
