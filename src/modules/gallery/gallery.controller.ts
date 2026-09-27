import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';

@ApiTags('Gallery')
@ApiBearerAuth()
@Controller('gallery')
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  @SetRoles(RoleEnum.ADMIN)
  @ApiQuery({ name: 'type', required: false })
  async findAll(@Query('type') type?: string) {
    return new ResponseDto(await this.galleryService.findAll(type));
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    return new ResponseDto(await this.galleryService.remove(id), 'Deleted');
  }
}
