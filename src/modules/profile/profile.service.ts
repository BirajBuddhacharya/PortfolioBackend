import { Injectable } from '@nestjs/common';
import { Prisma } from './entity/profile.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const DEFAULTS = {
  headline: '',
  coverImage: null,
  paragraphs: [] as string[],
  facts: [] as { k: string; v: string }[],
  stats: [] as { value: string; label: string }[],
  ticker: [] as string[],
  name: '',
  avatarImage: null,
  location: null,
  ctaLabel: 'Hire me',
  footerNote: null,
  resumePdfUrl: null,
  emailNotifications: true,
};

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  getProfile() {
    return this.prisma.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...DEFAULTS },
      update: {},
    });
  }

  updateProfile(dto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { id: 1 },
      data: { ...dto },
    });
  }
}
