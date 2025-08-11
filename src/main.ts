import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Covoiturage API')
    .setDescription('API pour le service de covoiturage')
    .setVersion('1.0')
    .addTag('tdllezie')
    .addBearerAuth( // 🔐 Ajout du support pour JWT
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez le token JWT',
        in: 'header',
      },
      'access-token', // nom de la sécurité à réutiliser avec @ApiBearerAuth('access-token')
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors();
  // await app.listen(4000);
  // 👈 Ajouté pour le déploiement sur web egt autre que localhost
  await app.listen(4000, '0.0.0.0');
}
bootstrap();
