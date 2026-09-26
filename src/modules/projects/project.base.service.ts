import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseService } from '../../common/service/base.service';
import { Prisma, Project } from './entity/project.entity';

@Injectable()
export class ProjectBaseService extends BaseService<
  Project,
  Prisma.ProjectWhereInput,
  Prisma.ProjectWhereUniqueInput,
  Prisma.ProjectCreateInput,
  Prisma.ProjectUpdateInput,
  Prisma.ProjectOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma.project);
  }
}
