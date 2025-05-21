import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { INGEST_QUEUE } from './queue.constants';
import { RecordsService } from '../records/records.service';

@Processor(INGEST_QUEUE)
@Injectable()
export class IngestProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestProcessor.name);

  constructor(private readonly recordsService: RecordsService) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`Processing ingest job: ${JSON.stringify(job.data)}`);

    const { url } = job.data as { url: string };

    return this.recordsService.processJsonFromUrl(url);
  }
}
