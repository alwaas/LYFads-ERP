import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttachmentDto, userTenantId: string) {
    // Validate uploader
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.uploadedBy,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Validate uploader belongs to the same tenant
    if (user.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot upload attachment for different tenant',
      );
    }

    // Validate project if provided
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: {
          id: dto.projectId,
        },
        select: {
          id: true,
          tenantId: true,
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found.');
      }

      // Validate project belongs to the same tenant
      if (project.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot attach to project from different tenant',
        );
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
          tenantId: true,
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found.');
      }

      // Validate task belongs to the same tenant
      if (task.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot attach to task from different tenant',
        );
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
          tenantId: true,
        },
      });

      if (!milestone) {
        throw new NotFoundException('Milestone not found.');
      }

      // Validate milestone belongs to the same tenant
      if (milestone.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot attach to milestone from different tenant',
        );
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
          tenantId: true,
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found.');
      }

      // Validate comment belongs to the same tenant
      if (comment.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot attach to comment from different tenant',
        );
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
        tenantId: userTenantId,
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

  async findAll(
    userTenantId: string,
    filters?: {
      projectId?: string;
      taskId?: string;
      milestoneId?: string;
      commentId?: string;
    },
  ) {
    const where = {
      tenantId: userTenantId,
      ...(filters?.projectId ? { projectId: filters.projectId } : {}),

      ...(filters?.taskId ? { taskId: filters.taskId } : {}),

      ...(filters?.milestoneId ? { milestoneId: filters.milestoneId } : {}),

      ...(filters?.commentId ? { commentId: filters.commentId } : {}),
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

  async findOne(id: string, userTenantId: string) {
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

    // Verify tenant ownership
    if (attachment.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this attachment');
    }

    return attachment;
  }

  async remove(id: string, userTenantId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found.');
    }

    // Verify tenant ownership
    if (attachment.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this attachment');
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
