import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // <<<< important !
  controllers: [DeliveryController],
  providers: [DeliveryService]
})
export class DeliveryModule {}
