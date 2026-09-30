import { forwardRef, Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
  imports: [forwardRef(() => UploadModule)],
})
export class GalleryModule {}
