import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from 'generated/prisma/enums';

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

  @ApiPropertyOptional({ enum: ['live', 'archived'], default: 'live' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ type: [String], description: 'Tag IDs to connect' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

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
