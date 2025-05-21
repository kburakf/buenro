import * as https from 'https';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import * as stream from 'stream';
import { promisify } from 'util';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterRecordDto } from './dto/filter-record.dto';
import { randomPriceSegment } from 'src/utils';
import { QueueService } from 'src/queue/queue.service';

interface JsonData {
  id: string;
  name?: string;
  city?: string;
  address?: { [key: string]: any };
  isAvailable?: boolean;
  priceForNight?: number;
  pricePerNight?: number;
  priceSegment?: string;
  data: object;
}

interface RecordCreateInput {
  sourceId: string;
  city?: string | null;
  name?: string | null;
  address?: { [key: string]: any };
  data: object;
  price?: number | null;
  isAvailability?: boolean;
  priceSegment?: string;
}

const pipelineAsync = promisify(stream.pipeline);

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  private normalizeRecord(data: JsonData): RecordCreateInput {
    return {
      sourceId: String(data.id),
      name: data.name,
      price: Number(data.priceForNight || data.pricePerNight) || null,
      address: data.address,
      city: data.city || data.address?.city || null,
      isAvailability: data.isAvailable,
      priceSegment: data.priceSegment || randomPriceSegment(),
      data,
    };
  }

  private async batchUpsertRecords(
    records: RecordCreateInput[],
  ): Promise<number> {
    if (!records.length) {
      return 0;
    }

    const CHUNK_SIZE = 100;
    let processed = 0;

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      let successCount = 0;

      for (const record of chunk) {
        try {
          await this.prisma.record.upsert({
            where: { sourceId: record.sourceId },
            update: record,
            create: record,
          });

          successCount++;
        } catch (recordError) {
          this.logger.error(
            `error upserting record ${record.sourceId}: ${recordError.message}`,
          );
        }
      }

      processed += successCount;
    }

    return processed;
  }

  async processJsonFromUrl(url: string): Promise<{ processed: number }> {
    let batch: RecordCreateInput[] = [];
    let processed = 0;

    const responseStream = await new Promise<stream.Readable>(
      (resolve, reject) => {
        https
          .get(url, (res) => {
            if (res.statusCode !== 200) {
              reject(new Error(`Failed to download: ${res.statusCode}`));
            } else {
              resolve(res);
            }
          })
          .on('error', reject);
      },
    );

    const jsonStream = parser();
    const arrayStream = streamArray();

    arrayStream.on('data', async ({ value }) => {
      const normalized = this.normalizeRecord(value);

      batch.push(normalized);

      if (batch.length >= 100) {
        arrayStream.pause();
        try {
          const uniqueBatch = Array.from(
            new Map(batch.map((item) => [item.sourceId, item])).values(),
          );

          const insertedCount = await this.batchUpsertRecords(uniqueBatch);
          processed += insertedCount;

          batch = [];
        } catch (error) {
          this.logger.error(`Error processing batch: ${error.message}`);
        } finally {
          arrayStream.resume();
        }
      }
    });

    arrayStream.on('end', async () => {
      if (batch.length) {
        const insertedCount = await this.batchUpsertRecords(batch);
        processed += insertedCount;
      }
    });

    arrayStream.on('error', (err) => {
      throw err;
    });

    await pipelineAsync(responseStream, jsonStream, arrayStream);

    this.queueService.addScheduledIngestJob(url, '0 * * * *'); // add interval for every hour

    return { processed };
  }

  async findAll(
    filterDto: FilterRecordDto & { page?: number; limit?: number },
  ) {
    const { page = 0, limit = 10, ...filters } = filterDto;
    const skip = page * limit;

    const where = {
      ...(filters.city && { city: filters.city }),
      ...(filters.name && {
        name: { contains: filters.name, mode: 'insensitive' },
      }),
      ...(filters.priceSegment && { priceSegment: filters.priceSegment }),
      ...(filters.price_gte && { price: { gte: filters.price_gte } }),
      ...(filters.price_lte && { price: { lte: filters.price_lte } }),
    } as Record<string, any>;

    const [data, total] = await Promise.all([
      this.prisma.record.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.record.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
