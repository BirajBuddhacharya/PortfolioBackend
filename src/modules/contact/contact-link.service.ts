import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactLinkDto } from './dto/create-contact-link.dto';
import { UpdateContactLinkDto } from './dto/update-contact-link.dto';

@Injectable()
export class ContactLinkService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.contactLink.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateContactLinkDto) {
    return this.prisma.contactLink.create({
      data: { ...dto, order: dto.order ?? 0 },
    });
  }

  async update(id: string, dto: UpdateContactLinkDto) {
    await this.findOneOrFail(id);
    return this.prisma.contactLink.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrFail(id);
    return this.prisma.contactLink.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const link = await this.prisma.contactLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException('Requested data not found');
    return link;
  }
}
