import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';       // <-- Ajouté
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
    
@Module({


  // imports: [
  //   PrismaModule,
  //   PassportModule.register({ defaultStrategy: 'jwt' }),  // <-- Ajouté (indispensable)
  //   JwtModule.register({
  //     secret: 'super-secret', // à sécuriser via .env et ConfigModule
  //     signOptions: { expiresIn: '1d' },
  //   }),
    
  // ],

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
    PrismaModule,
  ],
  
  controllers: [AuthController],
  providers: [AuthService, CloudinaryService, JwtStrategy],  // <-- JwtStrategy ajouté ici
  exports: [PassportModule, JwtModule],                       // <-- exporter pour pouvoir utiliser JwtAuthGuard ailleurs
})
export class AuthModule { }
