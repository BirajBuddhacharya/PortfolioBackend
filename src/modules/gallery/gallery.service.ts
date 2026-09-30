import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

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
  constructor(
    private prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  create(data: CreateGalleryInput) {
    return this.prisma.gallery.create({ data });
  }

  findAll(type?: string) {
    return this.prisma.gallery.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    const item = await this.prisma.gallery.findFirstOrThrow({ where: { id } });
    await this.uploadService.deleteFile(item.publicId);
    await this.prisma.gallery.delete({ where: { id } });
  }
}
