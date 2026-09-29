import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeItemBaseService } from './resume-item.base.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [ResumeController],
  providers: [ResumeItemBaseService, ResumeService],
  exports: [ResumeItemBaseService, ResumeService],
})
export class ResumeModule {}
