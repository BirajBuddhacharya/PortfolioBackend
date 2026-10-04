import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { PublicProjectController } from './project.public.controller';

@Module({
  controllers: [ProjectController, PublicProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
