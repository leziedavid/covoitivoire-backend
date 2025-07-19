import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FunctionService } from 'src/utils/pagination.service';

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
      PrismaModule],
  providers: [TransactionService,FunctionService],
  controllers: [TransactionController]
})
export class TransactionModule {}
