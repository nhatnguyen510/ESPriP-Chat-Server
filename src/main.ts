import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AppConfig } from './config';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guard';
import { RedisService } from './common/service';
import { ChatAdapter } from './chat/chat.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    }),
  );

  const config = app.get(AppConfig);
  app.enableCors({
    origin: config.cors.origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: false,
    }),
  );

  const reflector = new Reflector();

  app.useGlobalGuards(new JwtAuthGuard(reflector));

  const redisService = app.get(RedisService);

  const redisIoAdapter = new ChatAdapter(redisService.client, app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(config.port, '0.0.0.0');
}
bootstrap();
