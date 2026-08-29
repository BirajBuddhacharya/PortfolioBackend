import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './public.contact.controller';
import { ContactBaseService } from './common/contact.base.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, ContactBaseService],
})
export class ContactModule {}
