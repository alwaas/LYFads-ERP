import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('uploads')
export class UploadsController {
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
    uploadSingle(
    @UploadedFile() file: Express.Multer.File,
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

    return {
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      url: `/uploads/temp/${file.filename}`,
    };
  }
}
