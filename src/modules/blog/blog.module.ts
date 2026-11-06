import { Module } from '@nestjs/common';
import { AdminBlogController } from './blog.admin.controller';
import { BlogPublicController } from './blog.public.controller';
import { BlogService } from './blog.service';

@Module({
  controllers: [AdminBlogController, BlogPublicController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
