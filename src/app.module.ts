// src/app.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { NotificationModule } from './utils/notification.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { ConfigModule } from '@nestjs/config';
import { TripModule } from './trip/trip.module';
import { OrderModule } from './order/order.module';
import { WalletModule } from './wallet/wallet.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AllServiceModule } from './all-service/all-service.module';
import { VariantModule } from './variant/variant.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { DeliveryModule } from './delivery/delivery.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationsGatewayModule } from './notifications-gateway/notifications-gateway.module';
import { EcommerceOrderModule } from './ecommerce-order/ecommerce-order.module';
import { TransactionModule } from './transaction/transaction.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production', // ✅ en prod → pas de lecture fichier
      envFilePath: process.env.NODE_ENV !== 'production' ? '.env' : undefined, // ✅ en dev → lit .env
    }),
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
    PrismaModule,
    UtilsModule,
    NotificationModule,
    AuthModule,
    VehicleModule,
    TripModule,
    OrderModule,
    WalletModule,
    SubscriptionModule,
    AllServiceModule,
    VariantModule,
    CategoryModule,
    ProductModule,
    DeliveryModule,
    StatisticsModule,
    NotificationsGatewayModule,
    EcommerceOrderModule,
    TransactionModule,
    MessageModule,
  ],
})
export class AppModule {}
