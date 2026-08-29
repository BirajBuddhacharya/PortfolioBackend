import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { Contact, Prisma } from '../entities/contact.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ContactBaseService extends BaseService<
  Contact,
  Prisma.ContactWhereInput,
  Prisma.ContactWhereUniqueInput,
  Prisma.ContactCreateInput,
  Prisma.ContactUpdateInput,
  Prisma.ContactOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma.contact);
  }
}
