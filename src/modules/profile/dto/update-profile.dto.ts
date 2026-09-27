import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  @Type(() => Object)
  facts?: { k: string; v: string }[];

  @ApiPropertyOptional({ description: '{ value: string; label: string }[]' })
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  stats?: { value: string; label: string }[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ticker?: string[];

  @ApiPropertyOptional({ description: 'Displayed in the footer and as the navbar avatar fallback' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Navbar CTA button label' })
  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @ApiPropertyOptional({ description: 'Footer note shown after the auto-computed copyright year' })
  @IsOptional()
  @IsString()
  footerNote?: string;

  @ApiPropertyOptional({ description: 'Cloudinary URL of uploaded resume PDF' })
  @IsOptional()
  @IsString()
  resumePdfUrl?: string;
}
