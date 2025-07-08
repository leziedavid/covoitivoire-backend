import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { PrismaModule } from '../prisma/prisma.module'; // chemin vers PrismaModule
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
    PrismaModule],
  controllers: [VehicleController],
  providers: [VehicleService, CloudinaryService,FunctionService,JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class VehicleModule {}
