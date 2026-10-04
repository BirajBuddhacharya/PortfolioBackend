import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogPublicController } from './blog.public.controller';
import { BlogService } from './blog.service';

@Module({
  controllers: [BlogController, BlogPublicController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
