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
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query('search') search?: string) {
    return new ResponseDto(await this.tagService.findAll(search));
  }

  @Post()
  @SetRoles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateTagDto) {
    const start = performance.now();
    const response = new ResponseDto(
      await this.tagService.create(dto),
      'Tag created',
    );
    const durationMs = performance.now() - start;
    console.log(`create tag took ${durationMs.toFixed(2)}ms`);
    return response;
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    return new ResponseDto(await this.tagService.delete(id), 'Tag deleted');
  }
}
