import { Injectable } from '@nestjs/common';
import { ProjectBaseService } from './project.base.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectService {
  constructor(private projectBaseService: ProjectBaseService) {}

  findAll(pagination: PaginationDto) {
    return this.projectBaseService.find({}, { ...pagination, sort: { year: 'desc' } });
  }

  findById(id: string) {
    return this.projectBaseService.findOneOrFail({ id });
  }

  create(dto: CreateProjectDto) {
    return this.projectBaseService.create({
      ...dto,
      stack: dto.stack ?? [],
      gallery: dto.gallery ?? [],
      metrics: dto.metrics ?? [],
      coverHeight: dto.coverHeight ?? 260,
      coverAccent: dto.coverAccent ?? '#FF6B6B',
      coverColor: dto.coverColor ?? '#141418',
      status: dto.status ?? 'live',
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.projectBaseService.findOneOrFail({ id });
    return this.projectBaseService.update({ id }, dto as any);
  }

  async softDelete(id: string) {
    await this.projectBaseService.findOneOrFail({ id });
    return this.projectBaseService.softDelete({ id });
  }
}
