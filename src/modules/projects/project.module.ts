import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectBaseService } from './project.base.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectBaseService, ProjectService],
  exports: [ProjectBaseService, ProjectService],
})
export class ProjectModule {}
