import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';

export const PaginationSortQuery = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaginationDto => {
    const query = ctx.switchToHttp().getRequest().query;

    const positiveInt = (value: unknown, name: string, fallback: number) => {
      if (value === undefined || value === '') return fallback;
      if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        throw new BadRequestException(`${name} must be a positive integer`);
      }
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new BadRequestException(`${name} must be a positive integer`);
      }
      return parsed;
    };

    const rawPage = query.page;
    // `limit` is accepted as an alias for `size`; both are clamped.
    const rawSize = query.size ?? query.limit;
    const page = positiveInt(rawPage, 'page', 1);
    const size = Math.min(positiveInt(rawSize, 'size', 10), 100);

    const pagination =
      query.pagination === 'true' ||
      rawPage !== undefined ||
      rawSize !== undefined;

    const sortList = query.sort
      ? (query.sort as string).split(',')
      : ['updatedAt', 'desc'];

    if (sortList.length !== 2) {
      throw new BadRequestException('sort must be "field,asc" or "field,desc"');
    }

    if (sortList[1] !== 'asc' && sortList[1] !== 'desc') {
      throw new BadRequestException('sort direction must be "asc" or "desc"');
    }

    const sort: Record<string, 'asc' | 'desc'> = {
      [sortList[0]]: sortList[1],
    };

    if (!pagination) {
      return new PaginationDto(false, 0, 10, sort);
    }

    return new PaginationDto(true, (page - 1) * size, size, sort);
  },
);
