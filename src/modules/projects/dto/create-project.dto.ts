import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MetricDto {
  @IsString()
  value: string;

  @IsString()
  label: string;
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  blurb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Markdown body rendered on the detail page',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ required: false, example: 'ML' })
  @IsOptional()
  kind?: string;

  @ApiPropertyOptional({ enum: ['live', 'archived'], default: 'live' })
  @IsOptional()
  @IsIn(['live', 'archived'])
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stack?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional({ type: [MetricDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricDto)
  metrics?: MetricDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  live?: string;

  @ApiPropertyOptional()
  // @IsUrl()
  @IsOptional()
  repo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional({ default: 260 })
  @IsOptional()
  @IsInt()
  @Min(0)
  coverHeight?: number;

  @ApiPropertyOptional({ default: '#FF6B6B' })
  @IsOptional()
  @IsString()
  coverAccent?: string;

  @ApiPropertyOptional({ default: '#141418' })
  @IsOptional()
  @IsString()
  coverColor?: string;
}
