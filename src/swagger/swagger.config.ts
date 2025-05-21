import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { getSwaggerOptions } from './swagger.options';

export function setupSwagger(app: INestApplication) {
  const options = getSwaggerOptions();
  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api/docs', app, document);

  return document;
}
