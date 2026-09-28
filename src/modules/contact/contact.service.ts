import {
  Injectable,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ContactBaseService } from './common/contact.base.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { AllConfig } from 'src/config/config.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueueService } from 'src/queue/queue.service';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CONTACT_QUEUE = 'contact.create';

type ContactJobData = Omit<CreateContactDto, 'turnstileToken'>;

@Injectable()
export class ContactService implements OnModuleInit {
  constructor(
    private readonly contactBaseService: ContactBaseService,
    private readonly configService: ConfigService<AllConfig>,
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async onModuleInit() {
    await this.queue.boss.createQueue(CONTACT_QUEUE);
    await this.queue.boss.work<ContactJobData>(CONTACT_QUEUE, async (jobs) => {
      for (const job of jobs) {
        await this.contactBaseService.create(job.data as any);

        const appConfig = this.configService.get('app', { infer: true })!;
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
              subject: `${job.data.subject} — from ${job.data.name || job.data.email}`,
              html: job.data.message.replace(/\n/g, '<br>'),
            })
            .catch((err) => console.error('Failed to send contact email:', err));
        }
      }
    });
  }

  async create(dto: CreateContactDto) {
    const appConfig = this.configService.get('app', { infer: true })!;

    if (!appConfig.ignoreTurnstile) {
      if (!dto.turnstileToken)
        throw new BadRequestException('Captcha token required');

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
    }

    const { turnstileToken: _, ...contactData } = dto;
    await this.queue.boss.send(CONTACT_QUEUE, contactData);

    return { message: 'Message received' };
  }
}
