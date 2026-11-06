import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus } from 'generated/prisma/enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GetProjectsDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    required: false,
    description: 'Search by title',
    example: 'Tathyanka',
  })
  search?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false, description: 'Filter by tag ID' })
  tagId?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  @ApiPropertyOptional({
    required: false,
    description: 'Status of project',
    enum: ProjectStatus,
  })
  status?: ProjectStatus;
}

/**
 * Public listing only supports search + tag filters. `status` is deliberately
 * absent: archived projects are reachable exclusively through the admin route,
 * and sending `?status=...` now fails validation instead of being ignored.
 */
export class PublicGetProjectsDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false, description: 'Search by title' })
  search?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false, description: 'Filter by tag ID' })
  tagId?: string;
}
