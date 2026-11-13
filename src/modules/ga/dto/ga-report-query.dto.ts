import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type GaGranularity = 'hour' | 'day';

export class GaReportQueryDto {
  @ApiPropertyOptional({
    description: 'Inclusive start date (YYYY-MM-DD). Defaults to 30 days ago.',
    example: '2026-10-15',
  })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'startDate must be YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Inclusive end date (YYYY-MM-DD). Defaults to today.',
    example: '2026-11-13',
  })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'endDate must be YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Time-series bucket size. `hour` is intended for 24h ranges.',
    enum: ['hour', 'day'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['hour', 'day'])
  granularity?: GaGranularity;
}
