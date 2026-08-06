import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttachmentDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.uploadedBy,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.attachment.create({
      data: {
        fileName: dto.fileName,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        fileUrl: dto.fileUrl,

        uploadedBy: dto.uploadedBy,

        projectId: dto.projectId,
        taskId: dto.taskId,
        milestoneId: dto.milestoneId,
        commentId: dto.commentId,
      },

      include: {
        user: true,
        project: true,
        task: true,
        milestone: true,
        comment: true,
      },
    });
  }

  findAll() {
    return this.prisma.attachment.findMany({
      include: {
        user: true,
        project: true,
        task: true,
        milestone: true,
        comment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        project: true,
        task: true,
        milestone: true,
        comment: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found.');
    }

    return attachment;
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: {
        id,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found.');
    }

    await this.prisma.attachment.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Attachment deleted successfully.',
    };
  }
}
