import { Logger } from 'nestjs-pino';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppConfiguration } from './app.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get<ConfigService<AppConfiguration>>(ConfigService);

  app.useLogger(app.get(Logger));
  app.enableCors({ ...config.get('cors', { infer: true }), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tookey API')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-SIGNIN-KEY' }, 'signin')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-SHAREABLE-KEY' }, 'shareable')
    .addBearerAuth()
    .addBearerAuth(undefined, 'refresh');

  const document = SwaggerModule.createDocument(app, swaggerConfig.build());
  SwaggerModule.setup('swagger', app, document);

  await app.listen(config.get('port', { infer: true }));
}

bootstrap();
