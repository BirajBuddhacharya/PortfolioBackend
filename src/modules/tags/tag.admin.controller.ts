import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';
import { TagsOrderEnum } from './enum/tags-order.enum';

@ApiTags('Tags')
@ApiBearerAuth()
@Controller('tags')
export class AdminTagController {
  constructor(private tagService: TagService) {}

  @Get()
  @SetRoles(RoleEnum.ADMIN)
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'orderBy', enum: TagsOrderEnum, required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: TagsOrderEnum,
  ) {
    return new ResponseDto(await this.tagService.findAll(search, orderBy));
  }

  @Post()
  @SetRoles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateTagDto) {
    const response = new ResponseDto(
      await this.tagService.create(dto),
      'Tag created',
    );
    return response;
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    return new ResponseDto(await this.tagService.delete(id), 'Tag deleted');
  }
}
