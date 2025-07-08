import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/utils/notification';

@Module({
  controllers: [WalletController],
  providers: [WalletService,PrismaService,NotificationService]
})
export class WalletModule {}
