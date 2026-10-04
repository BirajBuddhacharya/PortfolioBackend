import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Prisma } from './entity/project.entity';
import { ProjectStatus } from 'generated/prisma/enums';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    pagination: PaginationDto,
    search?: string,
    status?: ProjectStatus,
    tagId?: string,
  ) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      ...(tagId ? { tags: { some: { id: tagId } } } : {}),
    };
    const orderBy: Prisma.ProjectOrderByWithRelationInput = { year: 'desc' };

    if (pagination.pagination) {
      const [result, total] = await Promise.all([
        this.prisma.project.findMany({
          where,
          orderBy,
          skip: pagination.skip,
          take: pagination.take,
          include: { tags: true },
        }),
        this.prisma.project.count({ where }),
      ]);
      return { result, total };
    }

    const result = await this.prisma.project.findMany({
      where,
      orderBy,
      include: { tags: true },
    });
    return { result, total: result.length };
  }

  async findBySlug(slug: string, status?: ProjectStatus) {
    const project = await this.prisma.project.findFirst({
      where: { slug, deletedAt: null, status },
      include: { tags: true },
    });
    if (!project) throw new NotFoundException('Requested data not found');
    return project;
  }

  async findById(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { tags: true },
    });
    if (!project) throw new NotFoundException('Requested data not found');
    return project;
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let n = 1;
    while (true) {
      const existing = await this.prisma.project.findFirst({
        where: { slug, deletedAt: null },
      });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${++n}`;
    }
  }

  async create(dto: CreateProjectDto) {
    const { tagIds, ...rest } = dto;
    const slug = await this.uniqueSlug(rest.slug);
    return this.prisma.project.create({
      data: {
        ...rest,
        slug,
        gallery: rest.gallery ?? [],
        metrics: (rest.metrics ?? []) as any,
        coverHeight: rest.coverHeight ?? 260,
        coverAccent: rest.coverAccent ?? '#FF6B6B',
        coverColor: rest.coverColor ?? '#141418',
        status: rest.status ?? ProjectStatus.ACTIVE,
        ...(tagIds?.length
          ? { tags: { connect: tagIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { tags: true },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.findById(id);
    const { tagIds, ...rest } = dto;
    const slug =
      rest.slug && rest.slug !== existing.slug
        ? await this.uniqueSlug(rest.slug, id)
        : rest.slug;
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(rest as any),
        ...(slug ? { slug } : {}),
        ...(tagIds !== undefined
          ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } }
          : {}),
      },
      include: { tags: true },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
