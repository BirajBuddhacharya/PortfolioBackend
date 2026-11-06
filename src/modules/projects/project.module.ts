import { Module } from '@nestjs/common';
import { AdminProjectController } from './project.admin.controller';
import { ProjectService } from './project.service';
import { PublicProjectController } from './project.public.controller';

@Module({
  controllers: [AdminProjectController, PublicProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
