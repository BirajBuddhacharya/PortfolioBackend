import { Module } from '@nestjs/common';
import { AdminTagController } from './tag.admin.controller';
import { PublicTagController } from './tag.public.controller';
import { TagService } from './tag.service';

@Module({
  controllers: [AdminTagController, PublicTagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
