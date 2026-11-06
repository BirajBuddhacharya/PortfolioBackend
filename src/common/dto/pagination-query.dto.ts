import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Pagination knobs are parsed by `@PaginationSortQuery()`, but they still have
 * to be declared on any `@Query()` DTO so `forbidNonWhitelisted` does not
 * reject a normal paginated request.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pagination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;
}
