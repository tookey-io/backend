import { Logger } from 'nestjs-pino';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppConfiguration } from './app.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = app.get<ConfigService<AppConfiguration>>(ConfigService);
  const port = config.get('port', { infer: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tookey API')
    .addApiKey({ type: 'apiKey', in: 'header' }, 'apiKey')
    .addBearerAuth()
    .addBearerAuth(undefined, 'refresh');

  const document = SwaggerModule.createDocument(app, swaggerConfig.build());
  SwaggerModule.setup('swagger', app, document);

  await app.listen(port);
}

bootstrap();
