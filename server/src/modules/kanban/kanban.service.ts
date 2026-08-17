import {
  ForbiddenException,
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

  async getBoard(projectId: string, userTenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: { id: true, tenantId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // Verify project belongs to the same tenant
    if (project.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this project');
    }

    return this.prisma.task.findMany({
      where: {
        projectId,
        tenantId: userTenantId,
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

  async moveTask(taskId: string, dto: MoveTaskDto, userTenantId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
      select: { id: true, tenantId: true, employeeId: true, title: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    // Verify task belongs to the same tenant
    if (task.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this task');
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
      tenantId: userTenantId,
    });

    return updated;
  }

  async statistics(projectId: string, userTenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: { id: true, tenantId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // Verify project belongs to the same tenant
    if (project.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this project');
    }

    return this.prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId,
        tenantId: userTenantId,
      },
      _count: {
        status: true,
      },
    });
  }
}
