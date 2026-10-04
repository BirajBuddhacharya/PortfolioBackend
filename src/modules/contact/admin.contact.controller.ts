import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContactStatusEnum } from '../../../generated/prisma/client';
import { ContactBaseService } from './common/contact.base.service';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';
import { PaginationSortQuery } from '../../decorators/pagination.decorator';
import { RequireSwaggerPaginationSort } from '../../decorators/swagger-pagination.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Contact')
@ApiBearerAuth()
@Controller('contact')
export class AdminContactController {
  constructor(private contactBaseService: ContactBaseService) {}

  @Get()
  @SetRoles(RoleEnum.ADMIN)
  @RequireSwaggerPaginationSort()
  async findAll(@PaginationSortQuery() pagination: PaginationDto) {
    return new ResponseDto(await this.contactBaseService.find({}, pagination));
  }

  @Patch(':id')
  @SetRoles(RoleEnum.ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactStatusDto,
  ) {
    await this.contactBaseService.findOneOrFail({ id });
    const data = dto.status ? { status: dto.status as ContactStatusEnum } : {};
    return new ResponseDto(
      await this.contactBaseService.update({ id }, data),
      'Message updated',
    );
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contactBaseService.findOneOrFail({ id });
    return new ResponseDto(
      await this.contactBaseService.softDelete({ id }),
      'Message deleted',
    );
  }
}
