import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecordDto {
  @ApiProperty({
    description: 'The full JSON data object to store',
    example: { name: 'Beach House', city: 'Miami', priceForNight: 250, amenities: ['pool', 'wifi'] }
  })
  @IsObject()
  data: any;

  @ApiProperty({
    description: 'Type of data source (e.g., hotels, apartments, rentals)',
    example: 'hotels',
    required: false
  })
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiProperty({
    description: 'City location',
    example: 'London',
    required: false
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Price value',
    example: 199.99,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Name of the item',
    example: 'Luxury Villa',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;
}
 