import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseService } from '../../common/service/base.service';
import { Prisma, User } from './entity/user.entity';

@Injectable()
export class UserBaseService extends BaseService<
  User,
  Prisma.UserWhereInput,
  Prisma.UserWhereUniqueInput,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma.user);
  }
}
