import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class KanbanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async getBoard(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return this.prisma.task.findMany({
      where: {
        projectId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          status: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });
  }

  async moveTask(taskId: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const updated = await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: dto.status,
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'KANBAN',
      description: `Task "${updated.title}" moved to ${updated.status}.`,
      userId: updated.employeeId ?? undefined,
    });

    return updated;
  }

  async statistics(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return this.prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId,
      },
      _count: {
        status: true,
      },
    });
  }
}
