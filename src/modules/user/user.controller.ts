import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { PaginationSortQuery } from '../../decorators/pagination.decorator';
import { RequireSwaggerPaginationSort } from '../../decorators/swagger-pagination.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ResponseDto } from '../../common/response/response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @SetRoles(RoleEnum.ADMIN)
  @RequireSwaggerPaginationSort()
  async findAll(@PaginationSortQuery() pagination: PaginationDto) {
    return new ResponseDto(await this.userService.findAll(pagination));
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return new ResponseDto(await this.userService.updateSelf(req.user.id, dto), 'Profile updated');
  }

  @Get(':id')
  @SetRoles(RoleEnum.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return new ResponseDto(await this.userService.findById(id));
  }

  @Post()
  @SetRoles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateUserDto) {
    return new ResponseDto(await this.userService.create(dto), 'User created');
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return new ResponseDto(await this.userService.softDelete(id), 'User deleted');
  }
}
