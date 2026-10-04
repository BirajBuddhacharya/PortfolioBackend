import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateTagDto) {
    return this.prisma.tag.upsert({
      where: { name: dto.name },
      create: { name: dto.name, color: dto.color },
      update: {},
    });
  }

  delete(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }
}
