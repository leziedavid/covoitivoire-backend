// src/utils/notification.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { NotificationService } from './notification';
import { PrismaModule } from '../prisma/prisma.module';  // pour injecter PrismaService
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
                    port: configService.get<number>('SMTP_PORT') || 587,
                    secure: false,
                    auth: {
                        user: configService.get<string>('SMTP_USER'),
                        pass: configService.get<string>('SMTP_PASS'),
                    },
                },
                defaults: {
                    from: 'Covoitivoire <no-reply@votredomaine.com>',
                },
                template: {
                    dir: join(__dirname, 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: { strict: true },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
