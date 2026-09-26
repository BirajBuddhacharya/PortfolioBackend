import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './public.contact.controller';
import { AdminContactController } from './admin.contact.controller';
import { ContactLinkController } from './contact-link.controller';
import { ContactBaseService } from './common/contact.base.service';
import { ContactLinkService } from './contact-link.service';

@Module({
  controllers: [ContactController, AdminContactController, ContactLinkController],
  providers: [ContactService, ContactBaseService, ContactLinkService],
})
export class ContactModule {}
