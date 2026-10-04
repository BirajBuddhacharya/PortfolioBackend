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

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @SkipAuthCheck()
  @RequireSwaggerPaginationSort()
  async findAll(
    @PaginationSortQuery() pagination: PaginationDto,
    @Query() query: GetProjectsDto,
  ) {
    return new ResponseDto(
      await this.projectService.findAll(
        pagination,
        query.search,
        query.status,
        query.tagId,
      ),
    );
  }

  @Get(':slug')
  @SkipAuthCheck()
  async findOne(@Param('slug') slug: string) {
    return new ResponseDto(await this.projectService.findBySlug(slug));
  }

  @Post()
  @SetRoles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateProjectDto) {
    return new ResponseDto(
      await this.projectService.create(dto),
      'Project created',
    );
  }

  @Patch(':id')
  @SetRoles(RoleEnum.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return new ResponseDto(
      await this.projectService.update(id, dto),
      'Project updated',
    );
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    return new ResponseDto(
      await this.projectService.softDelete(id),
      'Project deleted',
    );
  }
}
