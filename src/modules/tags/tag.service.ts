import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.tag.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: { name: 'asc' },
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
