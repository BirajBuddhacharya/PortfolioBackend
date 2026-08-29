import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function RequireSwaggerPaginationSort() {
  return applyDecorators(
    ApiQuery({ name: 'pagination', required: true, type: Boolean, example: true }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'size', required: false, type: Number, example: 10 }),
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      example: 'updatedAt,desc',
      description: 'Format: field,asc|desc',
    }),
  );
}
