import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';
import { PaginationSortQuery } from '../../decorators/pagination.decorator';
import { RequireSwaggerPaginationSort } from '../../decorators/swagger-pagination.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { GetProjectsDto } from './dto/get-projects.dto';
import { ProjectStatus } from 'generated/prisma/enums';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('public/projects')
@SkipAuthCheck()
export class PublicProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @RequireSwaggerPaginationSort()
  async findAll(
    @PaginationSortQuery() pagination: PaginationDto,
    @Query() query: GetProjectsDto,
  ) {
    return new ResponseDto(
      await this.projectService.findAll(
        pagination,
        query.search,
        ProjectStatus.ACTIVE,
        query.tagId,
      ),
    );
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return new ResponseDto(
      await this.projectService.findBySlug(slug, ProjectStatus.ACTIVE),
    );
  }
}
