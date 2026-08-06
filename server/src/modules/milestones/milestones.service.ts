import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const existing = await this.prisma.milestone.findFirst({
      where: {
        projectId: dto.projectId,
        title: dto.title,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Milestone already exists for this project.',
      );
    }

    const milestone = await this.prisma.milestone.create({
      data: dto,
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'MILESTONE',
      description: `Milestone "${milestone.title}" created successfully.`,
      userId: undefined,
    });

    return milestone;
  }

  async findAll() {
    return this.prisma.milestone.findMany({
      include: {
        project: true,
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
        project: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }

    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto) {
    await this.findOne(id);

    const milestone = await this.prisma.milestone.update({
      where: {
        id,
      },
      data: dto,
      include: {
        project: true,
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
    const milestone = await this.findOne(id);

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
}
