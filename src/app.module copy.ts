// src/app.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 👈 charge .env globalement
    // Configuration de Multer : stockage en mémoire et limite de 10 Mo
    MulterModule.register({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 },  // max 10 Mo
    }),
    // Modules métiers
    PrismaModule,   // exporte PrismaService
    UtilsModule,    // exporte CloudinaryService
    AuthModule, VehicleModule, TripModule, OrderModule, WalletModule, SubscriptionModule, AllServiceModule, VariantModule, CategoryModule, ProductModule, DeliveryModule, StatisticsModule,     // controllers + services auth
  ],
})
export class AppModule {}
