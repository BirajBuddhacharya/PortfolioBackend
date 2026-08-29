import { Controller, Post, Body } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactBaseService } from './common/contact.base.service';
import { SkipAuthCheck } from 'src/decorators/public.decorator';

@Controller('/public/contact')
@SkipAuthCheck()
export class ContactController {
  constructor(private readonly contactBaseService: ContactBaseService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactBaseService.create(createContactDto);
  }
}
