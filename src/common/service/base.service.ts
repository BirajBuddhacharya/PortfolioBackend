import { NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedData } from '../dto/paginated-data.dto';

/**
 * Patch applied by the soft-delete helpers. Every model handled by
 * BaseService is expected to carry a nullable `deletedAt` column.
 */
export type SoftDeletePatch = { deletedAt: Date | null };

/** Filter fragment used to exclude soft-deleted rows from every read. */
export type NotDeletedFilter = { deletedAt: null };

export type SortOrder = 'asc' | 'desc';

/**
 * Structural description of the subset of a Prisma model delegate that
 * BaseService relies on. Declared with method shorthand so parameters are
 * compared bivariantly — that is what lets a concrete generated delegate
 * (e.g. `prisma.user`) satisfy this interface despite Prisma's own methods
 * being generic over `SelectSubset<...>`.
 */
export interface PrismaModelDelegate<
  TModel,
  TWhereInput,
  TWhereUniqueInput,
  TCreateInput,
  TUpdateInput,
  TOrderByInput,
> {
  findMany(args: {
    where: TWhereInput & NotDeletedFilter;
    orderBy: TOrderByInput;
    skip?: number;
    take?: number;
  }): Promise<TModel[]>;

  findFirst(args: {
    where: TWhereInput & NotDeletedFilter;
  }): Promise<TModel | null>;

  create(args: { data: TCreateInput }): Promise<TModel>;

  createMany(args: { data: TCreateInput[] }): Promise<{ count: number }>;

  update(args: {
    where: TWhereUniqueInput;
    data: TUpdateInput | SoftDeletePatch;
  }): Promise<TModel>;

  updateMany(args: {
    where: TWhereInput;
    data: TUpdateInput | SoftDeletePatch;
  }): Promise<{ count: number }>;

  delete(args: { where: TWhereUniqueInput }): Promise<TModel>;

  count(args: { where: TWhereInput & NotDeletedFilter }): Promise<number>;

  upsert(args: {
    where: TWhereUniqueInput;
    create: TCreateInput;
    update: TUpdateInput;
  }): Promise<TModel>;
}

/**
 * Generic CRUD layer over a single Prisma model delegate.
 *
 * All read paths automatically exclude soft-deleted rows by merging
 * `{ deletedAt: null }` into the caller's filter.
 *
 * Subclasses must supply the model's generated Prisma types, e.g.
 *
 * ```ts
 * class UserBaseService extends BaseService<
 *   User,
 *   Prisma.UserWhereInput,
 *   Prisma.UserWhereUniqueInput,
 *   Prisma.UserCreateInput,
 *   Prisma.UserUpdateInput,
 *   Prisma.UserOrderByWithRelationInput
 * > {
 *   constructor(prisma: PrismaService) {
 *     super(prisma.user);
 *   }
 * }
 * ```
 */
export abstract class BaseService<
  TModel,
  TWhereInput extends object,
  TWhereUniqueInput extends object,
  TCreateInput extends object,
  TUpdateInput extends object,
  TOrderByInput extends object,
> {
  protected constructor(
    protected readonly model: PrismaModelDelegate<
      TModel,
      TWhereInput,
      TWhereUniqueInput,
      TCreateInput,
      TUpdateInput,
      TOrderByInput
    >,
  ) {}

  /** Merges the soft-delete guard into a caller-supplied filter. */
  protected notDeleted(
    where: TWhereInput = {} as TWhereInput,
  ): TWhereInput & NotDeletedFilter {
    return { ...where, deletedAt: null };
  }

  /** Falls back to newest-updated-first when no sort is supplied. */
  protected resolveOrderBy(paginationDto: PaginationDto): TOrderByInput {
    const sort: Record<string, SortOrder> = paginationDto.sort ?? {
      updatedAt: 'desc',
    };
    return sort as TOrderByInput;
  }

  async find(
    where: TWhereInput = {} as TWhereInput,
    paginationDto: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedData<TModel>> {
    const baseWhere = this.notDeleted(where);
    const orderBy = this.resolveOrderBy(paginationDto);

    if (paginationDto.pagination) {
      const [result, total] = await Promise.all([
        this.model.findMany({
          where: baseWhere,
          orderBy,
          skip: paginationDto.skip,
          take: paginationDto.take,
        }),
        this.model.count({ where: baseWhere }),
      ]);
      return new PaginatedData<TModel>(result, total);
    }

    const result = await this.model.findMany({ where: baseWhere, orderBy });
    return new PaginatedData<TModel>(result, result.length);
  }

  findOne(where: TWhereInput): Promise<TModel | null> {
    return this.model.findFirst({ where: this.notDeleted(where) });
  }

  async findOneOrFail(where: TWhereInput): Promise<TModel> {
    const record = await this.findOne(where);
    if (!record) throw new NotFoundException('Requested data not found');
    return record;
  }

  create(data: TCreateInput): Promise<TModel> {
    return this.model.create({ data });
  }

  createMany(data: TCreateInput[]): Promise<{ count: number }> {
    return this.model.createMany({ data });
  }

  update(where: TWhereUniqueInput, data: TUpdateInput): Promise<TModel> {
    return this.model.update({ where, data });
  }

  updateMany(
    where: TWhereInput,
    data: TUpdateInput,
  ): Promise<{ count: number }> {
    return this.model.updateMany({ where, data });
  }

  softDelete(where: TWhereUniqueInput): Promise<TModel> {
    return this.model.update({ where, data: { deletedAt: new Date() } });
  }

  softDeleteMany(where: TWhereInput): Promise<{ count: number }> {
    return this.model.updateMany({ where, data: { deletedAt: new Date() } });
  }

  restore(where: TWhereUniqueInput): Promise<TModel> {
    return this.model.update({ where, data: { deletedAt: null } });
  }

  hardDelete(where: TWhereUniqueInput): Promise<TModel> {
    return this.model.delete({ where });
  }

  count(where: TWhereInput = {} as TWhereInput): Promise<number> {
    return this.model.count({ where: this.notDeleted(where) });
  }

  async exists(where: TWhereInput): Promise<boolean> {
    return (await this.count(where)) > 0;
  }

  upsert(
    where: TWhereUniqueInput,
    create: TCreateInput,
    update: TUpdateInput,
  ): Promise<TModel> {
    return this.model.upsert({ where, create, update });
  }
}
