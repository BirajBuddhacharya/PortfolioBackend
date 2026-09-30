import { ApiProperty, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, isString } from 'class-validator';

export class GetProjectsDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Search query for projects',
    example: 'Tathyanka',
  })
  search: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Search query for projects',
    example: 'live',
  })
  status: string;
}
