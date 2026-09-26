import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseService } from '../../common/service/base.service';
import { Prisma, BlogPost } from './entity/blog-post.entity';

@Injectable()
export class BlogPostBaseService extends BaseService<
  BlogPost,
  Prisma.BlogPostWhereInput,
  Prisma.BlogPostWhereUniqueInput,
  Prisma.BlogPostCreateInput,
  Prisma.BlogPostUpdateInput,
  Prisma.BlogPostOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma.blogPost);
  }
}
