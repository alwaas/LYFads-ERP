import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  async create(dto: CreateMilestoneDto, userTenantId: string) {
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

    // Verify project belongs to the same tenant
    if (project.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create milestone for project from different tenant',
      );
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
        tenantId: userTenantId,
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
      tenantId: userTenantId,
    });

    return milestone;
  }

  async findAll(userTenantId: string) {
    return this.prisma.milestone.findMany({
      where: {
        tenantId: userTenantId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userTenantId: string) {
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

    // Verify tenant ownership
    if (milestone.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this milestone');
    }

    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto, userTenantId: string) {
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
        tenantId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Milestone not found.');
    }

    // Verify tenant ownership
    if (existing.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this milestone');
    }

    // Prevent tenantId spoofing - ignore any tenantId in the update DTO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenantId, ...updateData } = dto;

    const title = updateData.title?.trim();

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

    const startDate = updateData.startDate
      ? new Date(updateData.startDate)
      : existing.startDate;

    const deadline = updateData.deadline
      ? new Date(updateData.deadline)
      : existing.deadline;

    this.validateDates(startDate, deadline);

    const progress = updateData.progress ?? existing.progress;
    const status = updateData.status ?? existing.status;

    this.validateProgressStatus(progress, status);

    const milestone = await this.prisma.milestone.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && {
          title,
        }),

        ...(updateData.description !== undefined && {
          description: updateData.description?.trim() || null,
        }),

        ...(updateData.priority !== undefined && {
          priority: updateData.priority,
        }),

        ...(updateData.status !== undefined && {
          status,
        }),

        ...(updateData.progress !== undefined && {
          progress,
        }),

        ...(updateData.startDate !== undefined && {
          startDate,
        }),

        ...(updateData.deadline !== undefined && {
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
      tenantId: userTenantId,
    });

    return milestone;
  }

  async remove(id: string, userTenantId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        tenantId: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }

    // Verify tenant ownership
    if (milestone.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this milestone');
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
      tenantId: userTenantId,
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
