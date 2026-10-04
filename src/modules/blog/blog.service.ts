import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Prisma } from './entity/blog-post.entity';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  private toResponse(post: any) {
    const wordCount = (post.content ?? '').trim().split(/\s+/).filter(Boolean).length;
    return { ...post, readTime: Math.max(1, Math.round(wordCount / 200)) };
  }

  private async findMany(where: Prisma.BlogPostWhereInput, pagination: PaginationDto) {
    const orderBy: Prisma.BlogPostOrderByWithRelationInput =
      pagination.sort ?? { publishedAt: 'desc' };

    if (pagination.pagination) {
      const [result, total] = await Promise.all([
        this.prisma.blogPost.findMany({ where, orderBy, skip: pagination.skip, take: pagination.take, include: { tags: true } }),
        this.prisma.blogPost.count({ where }),
      ]);
      return { result, total };
    }

    const result = await this.prisma.blogPost.findMany({ where, orderBy, include: { tags: true } });
    return { result, total: result.length };
  }

  async findPublished(pagination: PaginationDto) {
    const { result, total } = await this.findMany({ status: 'published', deletedAt: null }, pagination);
    return { result: result.map((p) => this.toResponse(p)), total };
  }

  async findAllAdmin(pagination: PaginationDto, search?: string, status?: string) {
    const where: Prisma.BlogPostWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    const { result, total } = await this.findMany(where, pagination);
    return { result: result.map((p) => this.toResponse(p)), total };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({ where: { slug, deletedAt: null }, include: { tags: true } });
    if (!post) throw new NotFoundException('Requested data not found');
    return this.toResponse(post);
  }

  async findTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let n = 1;
    while (true) {
      const existing = await this.prisma.blogPost.findFirst({ where: { slug, deletedAt: null } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${++n}`;
    }
  }

  async create(dto: CreateBlogPostDto) {
    const { tagIds, ...rest } = dto;
    const slug = await this.uniqueSlug(rest.slug);
    const status = rest.status ?? 'draft';
    return this.prisma.blogPost.create({
      data: {
        ...rest,
        slug,
        status,
        publishedAt: rest.publishedAt
          ? new Date(rest.publishedAt)
          : status === 'published'
            ? new Date()
            : null,
        ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: { tags: true },
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.prisma.blogPost.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Requested data not found');
    const { tagIds, ...rest } = dto;
    const slug = rest.slug && rest.slug !== existing.slug
      ? await this.uniqueSlug(rest.slug, id)
      : rest.slug;
    const publishedAt =
      rest.status === 'published' && !existing.publishedAt
        ? new Date()
        : rest.publishedAt
          ? new Date(rest.publishedAt)
          : undefined;
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...rest,
        ...(slug ? { slug } : {}),
        ...(publishedAt !== undefined ? { publishedAt } : {}),
        ...(tagIds !== undefined ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } } : {}),
      },
      include: { tags: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.blogPost.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Requested data not found');
    return this.prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
