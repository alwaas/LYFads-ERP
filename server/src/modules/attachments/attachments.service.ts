import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttachmentDto) {
    // Validate uploader
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.uploadedBy,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Validate project if provided
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: {
          id: dto.projectId,
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found.');
      }
    }

    // Validate task if provided
    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: {
          id: dto.taskId,
        },
        select: {
          id: true,
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found.');
      }
    }

    // Validate milestone if provided
    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findUnique({
        where: {
          id: dto.milestoneId,
        },
        select: {
          id: true,
        },
      });

      if (!milestone) {
        throw new NotFoundException('Milestone not found.');
      }
    }

    // Validate comment if provided
    if (dto.commentId) {
      const comment = await this.prisma.comment.findUnique({
        where: {
          id: dto.commentId,
        },
        select: {
          id: true,
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found.');
      }
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: dto.fileName,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        fileUrl: dto.fileUrl,

        uploadedBy: dto.uploadedBy,

        projectId: dto.projectId ?? null,
        taskId: dto.taskId ?? null,
        milestoneId: dto.milestoneId ?? null,
        commentId: dto.commentId ?? null,
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },

        project: true,
        task: true,
        milestone: true,
        comment: true,
      },
    });

    return attachment;
  }

  async findAll(filters?: {
    projectId?: string;
    taskId?: string;
    milestoneId?: string;
    commentId?: string;
  }) {
    const where = {
      ...(filters?.projectId
        ? { projectId: filters.projectId }
        : {}),

      ...(filters?.taskId
        ? { taskId: filters.taskId }
        : {}),

      ...(filters?.milestoneId
        ? { milestoneId: filters.milestoneId }
        : {}),

      ...(filters?.commentId
        ? { commentId: filters.commentId }
        : {}),
    };

    return this.prisma.attachment.findMany({
      where,

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },

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
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },

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

      select: {
        id: true,
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
