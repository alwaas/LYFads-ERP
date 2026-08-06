import {
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

  async create(dto: CreateCommentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found.');
      }
    }

    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
      });

      if (!task) {
        throw new NotFoundException('Task not found.');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        message: dto.message,

        user: {
          connect: {
            id: dto.userId,
          },
        },

        ...(dto.projectId && {
          project: {
            connect: {
              id: dto.projectId,
            },
          },
        }),

        ...(dto.taskId && {
          task: {
            connect: {
              id: dto.taskId,
            },
          },
        }),
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
    });

    return comment;
  }

  async findAll() {
    return this.prisma.comment.findMany({
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

  async findOne(id: string) {
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

    return comment;
  }

  async update(id: string, dto: UpdateCommentDto) {
    await this.findOne(id);

    const comment = await this.prisma.comment.update({
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
      userId: comment.userId,
    });

    return comment;
  }

  async remove(id: string) {
    const comment = await this.findOne(id);

    await this.prisma.comment.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'COMMENT',
      description: 'Comment deleted.',
      userId: comment.userId,
    });

    return {
      success: true,
      message: 'Comment deleted successfully.',
    };
  }
}
