import { PartialType } from '@nestjs/swagger';
import { CreateContactLinkDto } from './create-contact-link.dto';

export class UpdateContactLinkDto extends PartialType(CreateContactLinkDto) {}
