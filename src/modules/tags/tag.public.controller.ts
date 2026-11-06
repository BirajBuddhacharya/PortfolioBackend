import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { ResponseDto } from '../../common/response/response.dto';
import { TagsOrderEnum } from './enum/tags-order.enum';

@ApiTags('Tags')
@Controller('public/tags')
@SkipAuthCheck()
export class PublicTagController {
  constructor(private tagService: TagService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'orderBy', enum: TagsOrderEnum, required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: TagsOrderEnum,
  ) {
    return new ResponseDto(await this.tagService.findAll(search, orderBy));
  }
}
