import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { ResponseDto } from '../../common/response/response.dto';
import { PaginationSortQuery } from '../../decorators/pagination.decorator';
import { RequireSwaggerPaginationSort } from '../../decorators/swagger-pagination.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Blog')
@Controller('public/blog')
@SkipAuthCheck()
export class BlogPublicController {
  constructor(private blogService: BlogService) {}

  @Get()
  @RequireSwaggerPaginationSort()
  async findAll(@PaginationSortQuery() pagination: PaginationDto) {
    return new ResponseDto(await this.blogService.findPublic(pagination));
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return new ResponseDto(await this.blogService.findPublicBySlug(slug));
  }
}
