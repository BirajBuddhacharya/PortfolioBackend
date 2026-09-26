import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';
import { PaginationSortQuery } from '../../decorators/pagination.decorator';
import { RequireSwaggerPaginationSort } from '../../decorators/swagger-pagination.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Blog')
@ApiBearerAuth()
@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get('tags')
  @SkipAuthCheck()
  async findTags() {
    return new ResponseDto(await this.blogService.findTags());
  }

  @Get('admin')
  @SetRoles(RoleEnum.ADMIN)
  @RequireSwaggerPaginationSort()
  async findAllAdmin(@PaginationSortQuery() pagination: PaginationDto) {
    return new ResponseDto(await this.blogService.findAllAdmin(pagination));
  }

  @Get()
  @SkipAuthCheck()
  @RequireSwaggerPaginationSort()
  async findPublished(@PaginationSortQuery() pagination: PaginationDto) {
    return new ResponseDto(await this.blogService.findPublished(pagination));
  }

  @Get(':id')
  @SkipAuthCheck()
  async findOne(@Param('id') id: string) {
    const post = await this.blogService.findById(id);
    if (post.status !== 'published') throw new NotFoundException('Requested data not found');
    return new ResponseDto(post);
  }

  @Post()
  @SetRoles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateBlogPostDto) {
    return new ResponseDto(await this.blogService.create(dto), 'Post created');
  }

  @Patch(':id')
  @SetRoles(RoleEnum.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return new ResponseDto(await this.blogService.update(id, dto), 'Post updated');
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    return new ResponseDto(await this.blogService.remove(id), 'Post deleted');
  }
}
