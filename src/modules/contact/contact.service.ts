import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ContactBaseService } from './common/contact.base.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { AllConfig } from 'src/config/config.type';
import { PrismaService } from 'src/prisma/prisma.service';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

@Injectable()
export class ContactService {
  constructor(
    private readonly contactBaseService: ContactBaseService,
    private readonly configService: ConfigService<AllConfig>,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateContactDto) {
    if (!dto.turnstileToken)
      throw new BadRequestException('Captcha token required');

    const appConfig = this.configService.get('app', { infer: true })!;

    if (!appConfig.turnstileSecretKey)
      throw new BadRequestException('Captcha not configured');

    const result = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: appConfig.turnstileSecretKey,
        response: dto.turnstileToken,
      }).toString(),
    }).then((r) => r.json() as Promise<{ success: boolean }>);

    if (!result.success)
      throw new BadRequestException('Captcha verification failed');

    const { turnstileToken: _, ...contactData } = dto;
    const contact = await this.contactBaseService.create(contactData as any);

    // send email notification if enabled
    const profile = await this.prisma.profile.findUnique({
      where: { id: 1 },
      select: { emailNotifications: true },
    });
    if (
      profile?.emailNotifications !== false &&
      appConfig.resendApiKey &&
      appConfig.contactEmail
    ) {
      const resend = new Resend(appConfig.resendApiKey);
      await resend.emails
        .send({
          from: 'WebsiteContact@resend.dev',
          to: appConfig.contactEmail,
          subject: `${dto.subject} — from ${dto.name || dto.email}`,
          html: dto.message.replace(/\n/g, '<br>'),
        })
        .catch((err) => console.error('Failed to send contact email:', err));
    }

    return contact;
  }
}
