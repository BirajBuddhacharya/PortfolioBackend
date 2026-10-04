import { Injectable, NotFoundException } from '@nestjs/common';
import { ResumeItemBaseService } from './resume-item.base.service';
import { CreateResumeItemDto } from './dto/create-resume-item.dto';
import { UpdateResumeItemDto } from './dto/update-resume-item.dto';
import { ResumeSectionEnum } from './entity/resume-item.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

function toPublicShape(item: {
  id: string;
  title: string;
  organization: string | null;
  period: string | null;
  location: string | null;
  body: string | null;
  points: string[];
}) {
  const { id, title, organization, period, location, body, points } = item;
  return { id, title, organization, period, location, body, points };
}

@Injectable()
export class ResumeService {
  constructor(
    private resumeItemBaseService: ResumeItemBaseService,
    private prisma: PrismaService,
  ) {}

  async getResumePdfUrl(): Promise<string> {
    const profile = await this.prisma.profile.findFirst();
    if (!profile?.resumePdfUrl)
      throw new NotFoundException('No resume PDF configured');
    return profile.resumePdfUrl;
  }

  async getGrouped() {
    const { result } = await this.resumeItemBaseService.find(
      {},
      new PaginationDto(false, 0, 10, { order: 'asc' }),
    );

    return {
      experiences: result
        .filter((i) => i.section === ResumeSectionEnum.EXPERIENCE)
        .map(toPublicShape),
      education: result
        .filter((i) => i.section === ResumeSectionEnum.EDUCATION)
        .map(toPublicShape),
      certifications: result
        .filter((i) => i.section === ResumeSectionEnum.CERTIFICATION)
        .map(toPublicShape),
      skills: result
        .filter((i) => i.section === ResumeSectionEnum.SKILL)
        .map(toPublicShape),
    };
  }

  findAllItems(pagination: PaginationDto) {
    return this.resumeItemBaseService.find({}, pagination);
  }

  createItem(dto: CreateResumeItemDto) {
    return this.resumeItemBaseService.create({
      ...dto,
      points: dto.points ?? [],
    });
  }

  async updateItem(id: string, dto: UpdateResumeItemDto) {
    await this.resumeItemBaseService.findOneOrFail({ id });
    return this.resumeItemBaseService.update({ id }, dto);
  }

  async removeItem(id: string) {
    await this.resumeItemBaseService.findOneOrFail({ id });
    return this.resumeItemBaseService.softDelete({ id });
  }
}
