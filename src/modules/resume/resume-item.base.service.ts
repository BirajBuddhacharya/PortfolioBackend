import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseService } from '../../common/service/base.service';
import { Prisma, ResumeItem } from './entity/resume-item.entity';

@Injectable()
export class ResumeItemBaseService extends BaseService<
  ResumeItem,
  Prisma.ResumeItemWhereInput,
  Prisma.ResumeItemWhereUniqueInput,
  Prisma.ResumeItemCreateInput,
  Prisma.ResumeItemUpdateInput,
  Prisma.ResumeItemOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma.resumeItem);
  }
}
