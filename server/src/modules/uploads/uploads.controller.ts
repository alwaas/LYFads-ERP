import {
  BadRequestException,
  Body,
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
import { CreateAttachmentDto } from '../attachments/dto/create-attachment.dto';

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
            `${Date.now()}-` +
            `${Math.round(Math.random() * 1e9)}` +
            extname(file.originalname);

          cb(null, uniqueName);
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Invalid file type received: ${file.mimetype}`,
            ),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      projectId?: string;
      taskId?: string;
      milestoneId?: string;
      commentId?: string;
    },
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException(
        'Maximum file size is 5 MB.',
      );
    }

    /*
     * JWT payload can commonly expose the user ID
     * as either "sub" or "id".
     */
    const uploadedBy = req.user?.sub ?? req.user?.id;

    if (!uploadedBy) {
      throw new BadRequestException(
        'Authenticated user ID not found.',
      );
    }

    const createAttachmentDto: CreateAttachmentDto = {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileUrl: `/uploads/temp/${file.filename}`,

      uploadedBy,

      projectId: body.projectId || undefined,
      taskId: body.taskId || undefined,
      milestoneId: body.milestoneId || undefined,
      commentId: body.commentId || undefined,
    };

    const attachment =
      await this.attachmentsService.create(
        createAttachmentDto,
      );

    return {
      success: true,
      data: attachment,
    };
  }
}