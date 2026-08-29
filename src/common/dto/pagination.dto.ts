export class PaginationDto {
  pagination: boolean;
  sort?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;

  constructor(
    pagination = false,
    skip = 0,
    take = 10,
    sort: Record<string, 'asc' | 'desc'> = { updatedAt: 'desc' },
  ) {
    this.pagination = pagination;
    this.skip = skip;
    this.take = take;
    this.sort = sort;
  }
}
