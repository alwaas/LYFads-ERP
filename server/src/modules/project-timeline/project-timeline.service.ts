import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class ProjectTimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async getTimeline(projectId: string, userTenantId: string) {
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

    const fullProject = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        client: true,

        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },

        milestones: {
          orderBy: {
            startDate: 'asc',
          },
        },

        tasks: {
          where: {
            tenantId: userTenantId,
          },
          orderBy: {
            dueDate: 'asc',
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
        },
      },
    });

    return fullProject;
  }

  async getUpcomingDeadlines(userTenantId: string) {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        completedAt: null,
        tenantId: userTenantId,
      },
      orderBy: {
        deadline: 'asc',
      },
      take: 10,
      include: {
        project: true,
      },
    });

    await this.activityLogsService.log({
      action: 'VIEW',
      module: 'PROJECT_TIMELINE',
      description: 'Viewed upcoming project deadlines.',
      tenantId: userTenantId,
    });

    return milestones;
  }
}
