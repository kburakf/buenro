import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as cors from 'cors';
import { json } from 'express';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    app.use(helmet());
    app.use(cors());

    app.use(json({ limit: process.env.MAX_JSON_SIZE || '1000mb' }));

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    setupSwagger(app);

    const port = process.env.PORT || 3000;

    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(
      `Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(`Failed to start application: ${errorMessage}`);
  }
}
bootstrap();
