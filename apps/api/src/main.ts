import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { loadConfig } from '@copilot/config';
import { logger } from '@copilot/observability';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [config.appBaseUrl],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI-Powered Developer Copilot API')
    .setDescription('Enterprise-minded repository intelligence, hybrid RAG Q&A, and PR intelligence')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.port);
  logger.info(`AI Developer Copilot API running on port ${config.port} in ${config.nodeEnv} mode`, {
    service: 'api',
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start API server', err, { service: 'api' });
  process.exit(1);
});
