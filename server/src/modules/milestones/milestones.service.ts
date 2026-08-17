import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MilestoneStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateMilestoneDto) {
    const startDate = new Date(dto.startDate);
    const deadline = new Date(dto.deadline);

    this.validateDates(startDate, deadline);

    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const existing = await this.prisma.milestone.findFirst({
      where: {
        projectId: dto.projectId,
        title: {
          equals: dto.title.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Milestone with this title already exists for this project.',
      );
    }

    const progress = dto.progress ?? 0;
    const status = dto.status ?? MilestoneStatus.NOT_STARTED;

    this.validateProgressStatus(progress, status);

    const milestone = await this.prisma.milestone.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || undefined,
        projectId: dto.projectId,
        status,
        priority: dto.priority,
        progress,
        startDate,
        deadline,
        tenantId: project.tenantId,
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'MILESTONE',
      description: `Milestone "${milestone.title}" created successfully for project "${project.name}".`,
      userId: undefined,
    });

    return milestone;
  }

  async findAll() {
    return this.prisma.milestone.findMany({
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }

    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto) {
    const existing = await this.prisma.milestone.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        startDate: true,
        deadline: true,
        progress: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Milestone not found.');
    }

    const title = dto.title?.trim();

    if (title) {
      const duplicate = await this.prisma.milestone.findFirst({
        where: {
          projectId: existing.projectId,
          title: {
            equals: title,
            mode: 'insensitive',
          },
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Milestone with this title already exists for this project.',
        );
      }
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;

    const deadline = dto.deadline ? new Date(dto.deadline) : existing.deadline;

    this.validateDates(startDate, deadline);

    const progress = dto.progress ?? existing.progress;
    const status = dto.status ?? existing.status;

    this.validateProgressStatus(progress, status);

    const milestone = await this.prisma.milestone.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && {
          title,
        }),

        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),

        ...(dto.priority !== undefined && {
          priority: dto.priority,
        }),

        ...(dto.status !== undefined && {
          status,
        }),

        ...(dto.progress !== undefined && {
          progress,
        }),

        ...(dto.startDate !== undefined && {
          startDate,
        }),

        ...(dto.deadline !== undefined && {
          deadline,
        }),
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'MILESTONE',
      description: `Milestone "${milestone.title}" updated successfully.`,
      userId: undefined,
    });

    return milestone;
  }

  async remove(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }

    await this.prisma.milestone.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'MILESTONE',
      description: `Milestone "${milestone.title}" deleted successfully.`,
      userId: undefined,
    });

    return {
      success: true,
      message: 'Milestone deleted successfully.',
    };
  }

  private validateDates(startDate: Date, deadline: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(deadline.getTime())) {
      throw new BadRequestException('Invalid milestone date.');
    }

    if (deadline < startDate) {
      throw new BadRequestException(
        'Deadline cannot be earlier than the start date.',
      );
    }
  }

  private validateProgressStatus(
    progress: number,
    status: MilestoneStatus,
  ): void {
    if (progress < 0 || progress > 100) {
      throw new BadRequestException(
        'Milestone progress must be between 0 and 100.',
      );
    }

    if (status === MilestoneStatus.COMPLETED && progress !== 100) {
      throw new BadRequestException(
        'Completed milestones must have 100% progress.',
      );
    }

    if (progress === 100 && status !== MilestoneStatus.COMPLETED) {
      throw new BadRequestException(
        'A milestone with 100% progress must have COMPLETED status.',
      );
    }
  }
}
