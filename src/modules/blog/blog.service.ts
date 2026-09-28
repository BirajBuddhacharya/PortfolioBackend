import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostBaseService } from './blog-post.base.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BlogPost, Prisma } from './entity/blog-post.entity';

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

  async findAllAdmin(pagination: PaginationDto, search?: string, status?: string) {
    const where: Prisma.BlogPostWhereInput = {
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    const { result, total } = await this.blogPostBaseService.find(where, pagination);
    return { result: result.map((p) => this.toResponse(p)), total };
  }

  async findById(id: string) {
    const post = await this.blogPostBaseService.findOneOrFail({ id });
    return this.toResponse(post);
  }

  async findBySlug(slug: string) {
    const post = await this.blogPostBaseService.findOneOrFail({ slug });
    return this.toResponse(post);
  }

  async findPublishedById(id: string) {
    const post = await this.blogPostBaseService.findOneOrFail({ id });
    if (post.status !== 'published') throw new NotFoundException('Requested data not found');
    return this.toResponse(post);
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let n = 1;
    while (true) {
      const existing = await this.blogPostBaseService.findOne({ slug } as any);
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${++n}`;
    }
  }

  async findTags() {
    const { result } = await this.blogPostBaseService.find({ status: 'published' });
    const tags = new Set<string>();
    result.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return [...tags].sort();
  }

  async create(dto: CreateBlogPostDto) {
    const slug = await this.uniqueSlug(dto.slug);
    const status = dto.status ?? 'draft';
    return this.blogPostBaseService.create({
      ...dto,
      slug,
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
    const slug = dto.slug && dto.slug !== existing.slug
      ? await this.uniqueSlug(dto.slug, id)
      : dto.slug;
    const publishedAt =
      dto.status === 'published' && !existing.publishedAt
        ? new Date()
        : dto.publishedAt
          ? new Date(dto.publishedAt)
          : undefined;
    return this.blogPostBaseService.update(
      { id },
      { ...dto, ...(slug ? { slug } : {}), ...(publishedAt !== undefined ? { publishedAt } : {}) },
    );
  }

  async remove(id: string) {
    await this.blogPostBaseService.findOneOrFail({ id });
    return this.blogPostBaseService.softDelete({ id });
  }
}
