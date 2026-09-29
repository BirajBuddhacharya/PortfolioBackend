import { Injectable } from '@nestjs/common';
import { ProjectBaseService } from './project.base.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Prisma } from './entity/project.entity';

@Injectable()
export class ProjectService {
  constructor(private projectBaseService: ProjectBaseService) {}

  findAll(pagination: PaginationDto, search?: string, status?: string) {
    const where: Prisma.ProjectWhereInput = {
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    return this.projectBaseService.find(where, { ...pagination, sort: { year: 'desc' } });
  }

  findById(id: string) {
    return this.projectBaseService.findOneOrFail({ id });
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let n = 1;
    while (true) {
      const existing = await this.projectBaseService.findOne({ slug } as any);
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${++n}`;
    }
  }

  findBySlug(slug: string) {
    return this.projectBaseService.findOneOrFail({ slug });
  }

  async create(dto: CreateProjectDto) {
    const slug = await this.uniqueSlug(dto.slug);
    return this.projectBaseService.create({
      ...dto,
      slug,
      stack: dto.stack ?? [],
      gallery: dto.gallery ?? [],
      metrics: (dto.metrics ?? []) as any,
      coverHeight: dto.coverHeight ?? 260,
      coverAccent: dto.coverAccent ?? '#FF6B6B',
      coverColor: dto.coverColor ?? '#141418',
      status: dto.status ?? 'live',
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.projectBaseService.findOneOrFail({ id });
    const slug = dto.slug && dto.slug !== existing.slug
      ? await this.uniqueSlug(dto.slug, id)
      : dto.slug;
    return this.projectBaseService.update({ id }, { ...dto as any, ...(slug ? { slug } : {}) });
  }

  async softDelete(id: string) {
    await this.projectBaseService.findOneOrFail({ id });
    return this.projectBaseService.softDelete({ id });
  }
}
