import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProjectTimelineService {
  constructor(private prisma: PrismaService) {}

  async getTimeline(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        milestones: {
          orderBy: {
            startDate: 'asc',
          },
        },
        tasks: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    return project;
  }

  async getUpcomingDeadlines() {
    return this.prisma.milestone.findMany({
      where: {
        completedAt: null,
      },
      orderBy: {
        deadline: 'asc',
      },
      take: 10,
      include: {
        project: true,
      },
    });
  }
}
