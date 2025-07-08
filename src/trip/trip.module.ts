import { Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FunctionService } from 'src/utils/pagination.service';

@Module({
  controllers: [TripController],
  providers: [TripService,PrismaService,FunctionService]
})
export class TripModule {}
