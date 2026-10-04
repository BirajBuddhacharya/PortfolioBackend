import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';

@ApiTags('Tags')
@ApiBearerAuth()
@Controller('tags')
export class TagController {
  constructor(private tagService: TagService) {}

  @Get()
  @SkipAuthCheck()
  async findAll() {
    return new ResponseDto(await this.tagService.findAll());
  }

  @Post()
  @SetRoles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateTagDto) {
    return new ResponseDto(await this.tagService.create(dto), 'Tag created');
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    return new ResponseDto(await this.tagService.delete(id), 'Tag deleted');
  }
}
