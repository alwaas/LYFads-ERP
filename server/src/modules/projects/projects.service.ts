import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateProjectDto, userTenantId: string) {
    const existingProject = await this.prisma.project.findUnique({
      where: {
        projectCode: dto.projectCode,
      },
    });

    if (existingProject) {
      throw new ConflictException('Project code already exists.');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { id: true, tenantId: true },
    });

    if (!client) {
      throw new NotFoundException('Client not found.');
    }

    // Validate client belongs to the same tenant
    if (client.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create project for client from different tenant',
      );
    }

    const project = await this.prisma.project.create({
      data: {
        projectCode: dto.projectCode,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        budget: dto.budget,
        clientId: dto.clientId,
        managerId: dto.managerId,
        tenantId: userTenantId,
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
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'PROJECT',
      description: `Project ${project.projectCode} created successfully.`,
      userId: project.managerId ?? undefined,
      tenantId: userTenantId,
    });

    return project;
  }

  async findAll(pagination: PaginationDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: {
          tenantId: userTenantId,
        },
        skip,
        take: limit,
        include: {
          client: true,
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.project.count({
        where: {
          tenantId: userTenantId,
        },
      }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }
  // TODO:
  // Add search, status, manager and client filters.

  async findOne(id: string, userTenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
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
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // Verify tenant ownership
    if (project.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this project');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    // If clientId is being changed, validate the new client belongs to the same tenant
    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
        select: { id: true, tenantId: true },
      });

      if (!client) {
        throw new NotFoundException('Client not found.');
      }

      if (client.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot assign project to client from different tenant',
        );
      }
    }

    const updatedProject = await this.prisma.project.update({
      where: {
        id,
      },
      data: {
        projectCode: dto.projectCode,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget,
        clientId: dto.clientId,
        managerId: dto.managerId,
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'PROJECT',
      description: `Project ${updatedProject.projectCode} updated successfully.`,
      userId: updatedProject.managerId ?? undefined,
      tenantId: userTenantId,
    });

    return updatedProject;
  }

  async remove(id: string, userTenantId: string) {
    const project = await this.findOne(id, userTenantId);

    await this.prisma.project.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'PROJECT',
      description: `Project ${project.projectCode} deleted successfully.`,
      userId: project.managerId ?? undefined,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Project deleted successfully.',
    };
  }
}
