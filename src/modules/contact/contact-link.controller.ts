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
import { ContactLinkService } from './contact-link.service';
import { CreateContactLinkDto } from './dto/create-contact-link.dto';
import { UpdateContactLinkDto } from './dto/update-contact-link.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';

@ApiTags('Contact Links')
@ApiBearerAuth()
@Controller('contact/links')
export class ContactLinkController {
  constructor(private contactLinkService: ContactLinkService) {}

  @Get()
  @SkipAuthCheck()
  async findAll() {
    return new ResponseDto(await this.contactLinkService.findAll());
  }

  @Post()
  @SetRoles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateContactLinkDto) {
    return new ResponseDto(
      await this.contactLinkService.create(dto),
      'Link created',
    );
  }

  @Patch(':id')
  @SetRoles(RoleEnum.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateContactLinkDto) {
    return new ResponseDto(
      await this.contactLinkService.update(id, dto),
      'Link updated',
    );
  }

  @Delete(':id')
  @SetRoles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    return new ResponseDto(
      await this.contactLinkService.remove(id),
      'Link deleted',
    );
  }
}
