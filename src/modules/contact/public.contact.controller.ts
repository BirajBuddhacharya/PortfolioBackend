import { Controller, Post, Body } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactService } from './contact.service';
import { SkipAuthCheck } from 'src/decorators/public.decorator';

@Controller('/public/contact')
@SkipAuthCheck()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }
}
