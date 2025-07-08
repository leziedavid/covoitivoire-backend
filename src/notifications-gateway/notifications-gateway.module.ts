// src/notifications-gateway/notifications-gateway.module.ts
import { Module } from '@nestjs/common'
import { NotificationsGateway } from './notifications.gateway'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
    imports: [JwtModule.register({}), PrismaModule],
    providers: [NotificationsGateway],
    exports: [NotificationsGateway, JwtModule], // <-- export JwtModule ici !
})
export class NotificationsGatewayModule { }
