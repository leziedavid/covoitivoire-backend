import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationService } from 'src/utils/notification';
import { NotificationsGatewayModule } from 'src/notifications-gateway/notifications-gateway.module'
import { NotificationsGateway } from 'src/notifications-gateway/notifications.gateway';
import { FunctionService } from 'src/utils/pagination.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/strategies/jwt.strategy';

@Module({
  imports: [
     ConfigModule, // 👈 pour injection locale (non nécessaire si global)
            JwtModule.registerAsync({
              imports: [ConfigModule],
              inject: [ConfigService],
              useFactory: async (config: ConfigService) => {
                console.log('JWT_SECRET from ConfigService:', config.get<string>('JWT_SECRET'));
                return {
                  secret: config.get<string>('JWT_SECRET'),
                  signOptions: { expiresIn: config.get<string>('JWT_EXPIRE') || '1d' },
                };
              }
            }),
            PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,NotificationsGatewayModule
  ], // <<<< important !
  controllers: [OrderController],
  providers: [OrderService, NotificationService, NotificationsGateway,FunctionService,JwtStrategy],
  exports: [OrderService,PassportModule, JwtModule],
})
export class OrderModule {}
