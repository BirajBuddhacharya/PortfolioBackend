import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResumeService } from './resume.service';
import { CreateResumeItemDto } from './dto/create-resume-item.dto';
import { UpdateResumeItemDto } from './dto/update-resume-item.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';
import { PaginationSortQuery } from '../../decorators/pagination.decorator';
import { RequireSwaggerPaginationSort } from '../../decorators/swagger-pagination.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Resume')
@ApiBearerAuth()
@Controller('resume')
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  @Get()
  @SkipAuthCheck()
  async getGrouped() {
    return new ResponseDto(await this.resumeService.getGrouped());
  }

  @Get('items')
  @SetRoles(RoleEnum.ADMIN)
  @RequireSwaggerPaginationSort()
  async findAllItems(@PaginationSortQuery() pagination: PaginationDto) {
    return new ResponseDto(await this.resumeService.findAllItems(pagination));
  }

  @Post('items')
  @SetRoles(RoleEnum.ADMIN)
  async createItem(@Body() dto: CreateResumeItemDto) {
    return new ResponseDto(await this.resumeService.createItem(dto), 'Resume item created');
  }

  @Patch('items/:id')
  @SetRoles(RoleEnum.ADMIN)
  async updateItem(@Param('id') id: string, @Body() dto: UpdateResumeItemDto) {
    return new ResponseDto(await this.resumeService.updateItem(id, dto), 'Resume item updated');
  }

  @Delete('items/:id')
  @SetRoles(RoleEnum.ADMIN)
  async removeItem(@Param('id') id: string) {
    return new ResponseDto(await this.resumeService.removeItem(id), 'Resume item deleted');
  }
}
