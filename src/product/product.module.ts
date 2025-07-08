import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { FunctionService } from 'src/utils/pagination.service';

@Module({
  imports: [PrismaModule], // <<<< important !
  controllers: [ProductController],
  providers: [ProductService,CloudinaryService,FunctionService]
})
export class ProductModule {}
