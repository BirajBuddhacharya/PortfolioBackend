import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateContactStatusDto {
  @ApiPropertyOptional({ enum: ['UNREAD', 'READ'] })
  @IsOptional()
  @IsIn(['UNREAD', 'READ'])
  status?: string;
}
