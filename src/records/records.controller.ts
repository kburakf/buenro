import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  HttpStatus,
  Body,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { FilterRecordDto } from './dto/filter-record.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import * as fs from 'fs';

@ApiTags('records')
@Controller('api/v1/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post('ingest-from-s3')
  @ApiOperation({ summary: 'Ingest a JSON file directly from AWS S3' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      required: ['url'],
    },
  })
  @ApiResponse({ status: 201, description: 'S3 file ingested successfully.' })
  async ingestFromS3(
    @Body()
    body: {
      url: string;
    },
  ) {
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }
    return this.recordsService.processJsonFromUrl(body.url);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all records with flexible filtering and pagination',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ type: FilterRecordDto })
  @ApiResponse({ status: 200, description: 'Filtered records list.' })
  findAll(@Query() filterDto: FilterRecordDto) {
    return this.recordsService.findAll(filterDto);
  }
}
