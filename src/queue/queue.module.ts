import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { INGEST_QUEUE } from './queue.constants';
import { RecordsModule } from '../records/records.module';
import { QueueService } from './queue.service';
import { IngestProcessor } from './ingest.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 100,
        attempts: 3,
      },
    }),
    BullModule.registerQueue({ name: INGEST_QUEUE }),
    RecordsModule,
  ],
  providers: [QueueService, IngestProcessor],
  exports: [QueueService],
})
export class QueueModule {}
