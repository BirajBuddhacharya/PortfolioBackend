import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus } from 'generated/prisma/enums';

export class GetProjectsDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Search by title',
    example: 'Tathyanka',
  })
  search: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Filter by tag ID' })
  tagId: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Stauts of project',
    enum: ProjectStatus,
  })
  status?: ProjectStatus;
}
