import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  memoryStorage,
} from 'multer';

import {
  AttachmentsService,
} from '../attachments/attachments.service';

import {
  CreateAttachmentDto,
} from '../attachments/dto/create-attachment.dto';

import {
  UploadsService,
} from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Post('single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (
        req,
        file,
        callback,
      ) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ];

        if (
          !allowedTypes.includes(
            file.mimetype,
          )
        ) {
          return callback(
            new BadRequestException(
              `Invalid file type received: ${file.mimetype}`,
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadSingle(
    @UploadedFile()
    file: Express.Multer.File,

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
      throw new BadRequestException(
        'File is required.',
      );
    }

    const uploadedBy =
      req.user?.sub ??
      req.user?.id;

    if (!uploadedBy) {
      throw new BadRequestException(
        'Authenticated user ID not found.',
      );
    }

    const uploadedFile =
      await this.uploadsService.uploadFile(
        file,
        'attachments',
      );

    const createAttachmentDto:
      CreateAttachmentDto = {
      fileName:
        uploadedFile.fileName,

      originalName:
        uploadedFile.originalName,

      mimeType:
        uploadedFile.mimeType,

      fileSize:
        uploadedFile.fileSize,

      fileUrl:
        uploadedFile.fileUrl,

      uploadedBy,

      projectId:
        body.projectId || undefined,

      taskId:
        body.taskId || undefined,

      milestoneId:
        body.milestoneId || undefined,

      commentId:
        body.commentId || undefined,
    };

    const attachment =
      await this.attachmentsService.create(
        createAttachmentDto,
      );

    return {
      success: true,

      data: {
        ...attachment,

        filePath:
          uploadedFile.filePath,
      },
    };
  }
}
