import { Module } from '@nestjs/common';
import { AllServiceController } from './all-service.controller';
import { AllServiceService } from './all-service.service';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FunctionService } from 'src/utils/pagination.service';

@Module({
  imports: [PrismaModule],
  controllers: [AllServiceController],
  providers: [AllServiceService,CloudinaryService,FunctionService]
})
export class AllServiceModule {}
