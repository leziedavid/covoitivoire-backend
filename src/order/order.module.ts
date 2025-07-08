import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationService } from 'src/utils/notification';
import { NotificationsGatewayModule } from 'src/notifications-gateway/notifications-gateway.module'
import { NotificationsGateway } from 'src/notifications-gateway/notifications.gateway';

@Module({
  imports: [PrismaModule,NotificationsGatewayModule], // <<<< important !
  controllers: [OrderController],
  providers: [OrderService, NotificationService, NotificationsGateway],
  exports: [OrderService],
})
export class OrderModule {}
