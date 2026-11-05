import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsCleanText } from '../common/validators/clean-text.decorator';

export class CreateContactLinkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCleanText()
  @MaxLength(60)
  label: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCleanText()
  @MaxLength(120)
  value: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCleanText()
  @MaxLength(2048)
  href: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}
