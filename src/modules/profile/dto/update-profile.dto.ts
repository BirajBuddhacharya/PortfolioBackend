import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paragraphs?: string[];

  @ApiPropertyOptional({ description: '{ k: string; v: string }[]' })
  @IsOptional()
  @IsArray()
  facts?: { k: string; v: string }[];

  @ApiPropertyOptional({ description: '{ value: string; label: string }[]' })
  @IsOptional()
  @IsArray()
  stats?: { value: string; label: string }[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ticker?: string[];
}
