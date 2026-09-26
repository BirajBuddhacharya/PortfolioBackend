import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPostBaseService } from './blog-post.base.service';

@Module({
  controllers: [BlogController],
  providers: [BlogPostBaseService, BlogService],
  exports: [BlogPostBaseService, BlogService],
})
export class BlogModule {}
