import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostBaseService } from './blog-post.base.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BlogPost } from './entity/blog-post.entity';

@Injectable()
export class BlogService {
  constructor(private blogPostBaseService: BlogPostBaseService) {}

  private toResponse(post: BlogPost) {
    const wordCount = (post.content ?? '').trim().split(/\s+/).filter(Boolean).length;
    return { ...post, readTime: Math.max(1, Math.round(wordCount / 200)) };
  }

  async findPublished(pagination: PaginationDto) {
    const { result, total } = await this.blogPostBaseService.find(
      { status: 'published' },
      { ...pagination, sort: pagination.sort ?? { publishedAt: 'desc' } },
    );
    return { result: result.map((p) => this.toResponse(p)), total };
  }

  async findAllAdmin(pagination: PaginationDto) {
    const { result, total } = await this.blogPostBaseService.find({}, pagination);
    return { result: result.map((p) => this.toResponse(p)), total };
  }

  async findById(id: string) {
    const post = await this.blogPostBaseService.findOneOrFail({ id });
    return this.toResponse(post);
  }

  async findPublishedById(id: string) {
    const post = await this.blogPostBaseService.findOneOrFail({ id });
    if (post.status !== 'published') throw new NotFoundException('Requested data not found');
    return this.toResponse(post);
  }

  async findTags() {
    const { result } = await this.blogPostBaseService.find({ status: 'published' });
    const tags = new Set<string>();
    result.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return [...tags].sort();
  }

  create(dto: CreateBlogPostDto) {
    const status = dto.status ?? 'draft';
    return this.blogPostBaseService.create({
      ...dto,
      tags: dto.tags ?? [],
      status,
      publishedAt: dto.publishedAt
        ? new Date(dto.publishedAt)
        : status === 'published'
          ? new Date()
          : null,
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.blogPostBaseService.findOneOrFail({ id });
    const publishedAt =
      dto.status === 'published' && !existing.publishedAt
        ? new Date()
        : dto.publishedAt
          ? new Date(dto.publishedAt)
          : undefined;
    return this.blogPostBaseService.update(
      { id },
      { ...dto, ...(publishedAt !== undefined ? { publishedAt } : {}) },
    );
  }

  async remove(id: string) {
    await this.blogPostBaseService.findOneOrFail({ id });
    return this.blogPostBaseService.softDelete({ id });
  }
}
