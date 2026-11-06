import { Controller, Post, Body } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactService } from './contact.service';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { ResponseDto } from '../../common/response/response.dto';

@Controller('/public/contact')
@SkipAuthCheck()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async create(@Body() dto: CreateContactDto) {
    const contact = await this.contactService.create(dto);

    // Return a static acknowledgement plus a non-sensitive reference only.
    // Never echo the submitted name/email/subject/message back (V5).
    return new ResponseDto(
      { id: contact.id, createdAt: contact.createdAt },
      'Message sent',
    );
  }
}
