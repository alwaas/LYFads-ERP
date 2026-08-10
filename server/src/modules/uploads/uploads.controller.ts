import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { AttachmentsService } from '../attachments/attachments.service';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Post('single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);

          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPG, PNG, WEBP and PDF files are allowed.',
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException(
        'Maximum file size is 5 MB.',
      );
    }

    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestException(
        'Authenticated user not found.',
      );
    }

    const attachment =
      await this.attachmentsService.create({
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/temp/${file.filename}`,
        uploadedBy: userId,
      });

    return {
      success: true,
      data: attachment,
    };
  }
}
