import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactBaseService } from './common/contact.base.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { AllConfig } from 'src/config/config.type';
import validate from 'deep-email-validator';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// small
@Injectable()
export class ContactService {
  constructor(
    private readonly contactBaseService: ContactBaseService,
    private readonly configService: ConfigService<AllConfig>,
  ) {}

  async create(dto: CreateContactDto) {
    const secret = this.configService.get('app', {
      infer: true,
    })!.turnstileSecretKey;
    if (!secret) throw new BadRequestException('Captcha not configured');

    const result = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: dto.turnstileToken,
      }).toString(),
    }).then((r) => r.json() as Promise<{ success: boolean }>);

    if (!result.success)
      throw new BadRequestException('Captcha verification failed');

    const emailValidation = await validate({
      email: dto.email,
      validateRegex: true,
      validateMx: true,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: true,
    });
    if (!emailValidation.valid)
      throw new BadRequestException(`Invalid email: ${emailValidation.reason}`);

    const { turnstileToken: _, ...contactData } = dto;
    return this.contactBaseService.create(contactData as any);
  }
}
