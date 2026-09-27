import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { GalleryService } from '../gallery/gallery.service';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(
    private uploadService: UploadService,
    private galleryService: GalleryService,
  ) {}

  @Post('image')
  @SetRoles(RoleEnum.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const result = await this.uploadService.uploadImage(file);
    const entry = await this.galleryService.create({
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      type: 'image',
      folder: result.folder ?? 'portfolio/images',
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    });
    return new ResponseDto(entry, 'Image uploaded');
  }

  @Post('pdf')
  @SetRoles(RoleEnum.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const result = await this.uploadService.uploadPdf(file);
    const entry = await this.galleryService.create({
      publicId: result.public_id,
      url: result.secure_url,
      format: 'pdf',
      type: 'pdf',
      folder: result.folder ?? 'portfolio/resumes',
      bytes: result.bytes,
    });
    return new ResponseDto(entry, 'PDF uploaded');
  }
}
