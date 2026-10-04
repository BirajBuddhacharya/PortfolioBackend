import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { inflateRawSync } from 'zlib';
import axios from 'axios';
import type { Response } from 'express';

const EOCD_SIGNATURE = Buffer.from([0x50, 0x4b, 0x05, 0x06]);

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    });
  }

  deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  private uploadStream(
    buffer: Buffer,
    options: Record<string, unknown>,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Upload failed'));
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }
    return this.uploadStream(file.buffer, {
      folder: 'portfolio/images',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
  }

  async uploadPdf(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('File must be a PDF');
    }
    return this.uploadStream(file.buffer, {
      folder: 'portfolio/resumes',
      resource_type: 'raw',
      type: 'upload',
      format: 'pdf',
      access_mode: 'public',
    });
  }

  // This account blocks PDF delivery on the CDN: res.cloudinary.com returns 401 for every
  // variant (raw/image, signed/unsigned). The Admin API generate_archive endpoint is the only
  // path that serves the bytes, so fetch a single-entry zip and unwrap it.
  // Proper fix is enabling PDF delivery in Cloudinary console, which would let us drop all this.
  async proxyPdf(cloudinaryUrl: string, res: Response): Promise<void> {
    if (!cloudinaryUrl) throw new NotFoundException('No resume PDF configured');

    const parts = new URL(cloudinaryUrl).pathname.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1)
      throw new BadRequestException('Invalid Cloudinary URL');

    let idStart = uploadIdx + 1;
    if (parts[idStart]?.match(/^v\d+$/)) idStart++;
    // Raw resources keep the extension in their public_id
    const publicId = parts.slice(idStart).join('/');

    const archiveUrl = cloudinary.utils.download_archive_url({
      resource_type: 'raw',
      type: 'upload',
      public_ids: [publicId],
      target_format: 'zip',
    });

    let zip: Buffer;
    try {
      const upstream = await axios.get<ArrayBuffer>(archiveUrl, {
        responseType: 'arraybuffer',
        validateStatus: (s) => s === 200,
      });
      zip = Buffer.from(upstream.data);
    } catch {
      // Swallow the axios error object — it holds the http Agent and breaks the exceptions filter
      throw new NotFoundException(
        'Resume PDF could not be retrieved from storage',
      );
    }

    const pdf = extractSoleZipEntry(zip);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdf.length));
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
    res.end(pdf);
  }
}

// ponytail: minimal single-entry zip reader, enough for Cloudinary's archive output.
// Swap for a real unzip dep if archives ever hold more than one file.
function extractSoleZipEntry(zip: Buffer): Buffer {
  const eocd = zip.lastIndexOf(EOCD_SIGNATURE);
  if (eocd === -1)
    throw new BadRequestException('Malformed archive from storage');

  // Local header sizes are zeroed when a data descriptor is used, so read the central directory
  const cdOffset = zip.readUInt32LE(eocd + 16);
  const method = zip.readUInt16LE(cdOffset + 10);
  const compressedSize = zip.readUInt32LE(cdOffset + 20);
  const localOffset = zip.readUInt32LE(cdOffset + 42);

  const nameLen = zip.readUInt16LE(localOffset + 26);
  const extraLen = zip.readUInt16LE(localOffset + 28);
  const start = localOffset + 30 + nameLen + extraLen;
  const payload = zip.subarray(start, start + compressedSize);

  return method === 0 ? payload : inflateRawSync(payload);
}
