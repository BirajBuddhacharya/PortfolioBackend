import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';

export const PaginationSortQuery = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaginationDto => {
    const query = ctx.switchToHttp().getRequest().query;

    const pagination = query.pagination === 'true';
    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const size = query.size ? parseInt(query.size as string, 10) : 10;

    const sortList = query.sort
      ? (query.sort as string).split(',')
      : ['updatedAt', 'desc'];

    if (sortList.length !== 2) {
      throw new BadRequestException('sort must be "field,asc" or "field,desc"');
    }

    const sort: Record<string, 'asc' | 'desc'> = {
      [sortList[0]]: sortList[1] as 'asc' | 'desc',
    };

    if (!pagination) {
      return new PaginationDto(false, 0, 10, sort);
    }

    return new PaginationDto(true, (page - 1) * size, size, sort);
  },
);
