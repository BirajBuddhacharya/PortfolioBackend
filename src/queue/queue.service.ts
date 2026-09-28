import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';
import { AllConfig } from 'src/config/config.type';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  readonly boss: PgBoss;

  constructor(private readonly config: ConfigService<AllConfig>) {
    const { databaseUrl } = config.get('app', { infer: true })!;
    this.boss = new PgBoss(databaseUrl);
  }

  async onModuleInit() {
    await this.boss.start();
  }

  async onModuleDestroy() {
    await this.boss.stop();
  }
}
