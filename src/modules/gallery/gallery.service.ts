import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateGalleryInput = {
  publicId: string;
  url: string;
  format: string;
  type: string;
  alt?: string;
  folder?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateGalleryInput) {
    return this.prisma.gallery.create({ data });
  }

  findAll(type?: string) {
    return this.prisma.gallery.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  remove(id: string) {
    return this.prisma.gallery.delete({ where: { id } });
  }
}
