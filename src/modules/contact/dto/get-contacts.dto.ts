import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GetContactsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(320)
  @ApiPropertyOptional({ description: 'Exact match on sender email' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({
    description: 'Case-insensitive search across name, email, subject, message',
  })
  search?: string;

  @IsOptional()
  @IsIn(['UNREAD', 'READ'])
  @ApiPropertyOptional({ enum: ['UNREAD', 'READ'] })
  status?: 'UNREAD' | 'READ';
}
