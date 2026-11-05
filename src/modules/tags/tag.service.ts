import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagsOrderEnum } from './enum/tags-order.enum';
import { Prisma } from 'generated/prisma/browser';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, orderBy?: TagsOrderEnum) {
    const buildSort = (
      orderBy?: TagsOrderEnum,
    ):
      | Prisma.TagOrderByWithRelationInput
      | Prisma.TagOrderByWithRelationInput[]
      | undefined => {
      if (orderBy === TagsOrderEnum.PROJECT) {
        return { projects: { _count: 'desc' } };
      } else if (orderBy === TagsOrderEnum.BLOG) {
        return { blogPosts: { _count: 'desc' } };
      }
      return undefined;
    };

    return await this.prisma.tag.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: {
        _count: { select: { projects: true, blogPosts: true } },
      },
      orderBy: buildSort(orderBy),
    });
  }

  async create(dto: CreateTagDto) {
    const start = performance.now();
    const data = await this.prisma.tag.upsert({
      where: { name: dto.name },
      create: { name: dto.name, color: dto.color },
      update: {},
    });
    const durationMs = performance.now() - start;
    console.log(`create tag took ${durationMs.toFixed(2)}ms`);

    return data;
  }

  delete(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }
}
