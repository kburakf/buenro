import { DocumentBuilder } from '@nestjs/swagger';

export function getSwaggerOptions() {
  return new DocumentBuilder()
    .setTitle('Data Ingestion API')
    .setDescription('API documentation data ingestion system')
    .setVersion('1.0')
    .addTag('records', 'Flexible data storage and querying')
    .addBearerAuth()
    .build();
}
