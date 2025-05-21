import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INGEST_QUEUE } from './queue.constants';

@Injectable()
export class QueueService {
  constructor(@InjectQueue(INGEST_QUEUE) private ingestQueue: Queue) {}

  async addScheduledIngestJob(data: any, cron: string) {
    return this.ingestQueue.add('ingest', data, { repeat: { pattern: cron } });
  }
}
