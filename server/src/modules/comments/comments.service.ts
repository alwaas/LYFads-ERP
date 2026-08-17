import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateCommentDto, userTenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Validate user belongs to the same tenant
    if (user.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create comment for different tenant',
      );
    }

    let projectTenantId: string | undefined;
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { id: true, tenantId: true },
      });

      if (!project) {
        throw new NotFoundException('Project not found.');
      }

      // Validate project belongs to the same tenant
      if (project.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot comment on project from different tenant',
        );
      }

      projectTenantId = project.tenantId;
    }

    let taskTenantId: string | undefined;
    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
        select: { id: true, tenantId: true },
      });

      if (!task) {
        throw new NotFoundException('Task not found.');
      }

      // Validate task belongs to the same tenant
      if (task.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot comment on task from different tenant',
        );
      }

      taskTenantId = task.tenantId;
    }

    const tenantId = projectTenantId || taskTenantId || userTenantId;

    const comment = await this.prisma.comment.create({
      data: {
        message: dto.message,
        userId: dto.userId,
        tenantId,
        projectId: dto.projectId ?? null,
        taskId: dto.taskId ?? null,
      },

      include: {
        user: true,
        project: true,
        task: true,
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'COMMENT',
      description: 'Comment created.',
      userId: user.id,
      tenantId,
    });

    return comment;
  }

  async findAll(userTenantId: string) {
    return this.prisma.comment.findMany({
      where: {
        tenantId: userTenantId,
      },
      include: {
        user: true,
        project: true,
        task: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userTenantId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        task: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    // Verify tenant ownership
    if (comment.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this comment');
    }

    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: dto,
      include: {
        user: true,
        project: true,
        task: true,
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'COMMENT',
      description: 'Comment updated.',
      userId: updatedComment.userId,
      tenantId: userTenantId,
    });

    return updatedComment;
  }

  async remove(id: string, userTenantId: string) {
    const comment = await this.findOne(id, userTenantId);

    await this.prisma.comment.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'COMMENT',
      description: 'Comment deleted.',
      userId: comment.userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Comment deleted successfully.',
    };
  }
}
