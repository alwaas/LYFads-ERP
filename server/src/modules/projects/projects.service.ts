import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../database';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  /**
   * Create a project inside the authenticated tenant.
   */
  async create(dto: CreateProjectDto, userTenantId: string) {
    const projectCode = dto.projectCode.trim();

    this.validateProjectDates(dto.startDate, dto.endDate);

    // Validate project code (tenant-scoped uniqueness).
    const existingProject = await this.prisma.project.findFirst({
      where: {
        projectCode,
        tenantId: userTenantId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (existingProject) {
      throw new ConflictException(
        'Project code already exists in this tenant.',
      );
    }

    // Client must belong to the authenticated tenant.
    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        tenantId: userTenantId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!client) {
      throw new ForbiddenException(
        'Client does not belong to the current tenant.',
      );
    }

    // Manager is optional, but if supplied it must belong
    // to the authenticated tenant.
    if (dto.managerId) {
      await this.validateManagerTenant(dto.managerId, userTenantId);
    }

    const project = await this.prisma.project.create({
      data: {
        projectCode,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        status: dto.status,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        budget: dto.budget,
        clientId: client.id,
        managerId: dto.managerId ?? null,
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
      description: `Project "${project.projectCode}" created successfully.`,
      userId: undefined,
      tenantId: userTenantId,
    });

    return project;
  }

  /**
   * Return only projects belonging to the authenticated tenant.
   */
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
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      data,
    };
  }

  /**
   * Return one project only if it belongs to the tenant.
   */
  async findOne(id: string, userTenantId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
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

    if (!project) {
      throw new ForbiddenException('Access denied to this project.');
    }

    return project;
  }

  /**
   * Update a project without allowing tenant reassignment.
   */
  async update(id: string, dto: UpdateProjectDto, userTenantId: string) {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id,
        tenantId: userTenantId,
      },
      select: {
        id: true,
        tenantId: true,
        projectCode: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!existingProject) {
      throw new ForbiddenException('Access denied to this project.');
    }

    const projectCode = dto.projectCode?.trim();

    if (projectCode) {
      const duplicate = await this.prisma.project.findFirst({
        where: {
          projectCode,
          tenantId: userTenantId,
          id: {
            not: id,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Project code already exists in this tenant.',
        );
      }
    }

    // Validate new client.
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: dto.clientId,
          tenantId: userTenantId,
        },
        select: {
          id: true,
        },
      });

      if (!client) {
        throw new ForbiddenException(
          'Client does not belong to the current tenant.',
        );
      }
    }

    // Validate new manager.
    if (dto.managerId) {
      await this.validateManagerTenant(dto.managerId, userTenantId);
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existingProject.startDate;

    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : existingProject.endDate;

    this.validateProjectDates(startDate?.toISOString(), endDate?.toISOString());

    const updatedProject = await this.prisma.project.update({
      where: {
        id,
      },
      data: {
        ...(projectCode !== undefined && {
          projectCode,
        }),

        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),

        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),

        ...(dto.status !== undefined && {
          status: dto.status,
        }),

        ...(dto.priority !== undefined && {
          priority: dto.priority,
        }),

        ...(dto.startDate !== undefined && {
          startDate,
        }),

        ...(dto.endDate !== undefined && {
          endDate,
        }),

        ...(dto.budget !== undefined && {
          budget: dto.budget,
        }),

        ...(dto.clientId !== undefined && {
          clientId: dto.clientId,
        }),

        ...(dto.managerId !== undefined && {
          managerId: dto.managerId || null,
        }),

        // IMPORTANT:
        // tenantId is deliberately never taken from DTO.
        // It remains unchanged.
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
      action: 'UPDATE',
      module: 'PROJECT',
      description: `Project "${updatedProject.projectCode}" updated successfully.`,
      userId: undefined,
      tenantId: userTenantId,
    });

    return updatedProject;
  }

  /**
   * Delete only a project belonging to the authenticated tenant.
   */
  async remove(id: string, userTenantId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        tenantId: userTenantId,
      },
      select: {
        id: true,
        projectCode: true,
      },
    });

    if (!project) {
      throw new ForbiddenException('Access denied to this project.');
    }

    await this.prisma.project.delete({
      where: {
        id: project.id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'PROJECT',
      description: `Project "${project.projectCode}" deleted successfully.`,
      userId: undefined,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Project deleted successfully.',
    };
  }

  /**
   * Validate that a manager/user belongs to the same tenant.
   */
  private async validateManagerTenant(
    managerId: string,
    userTenantId: string,
  ): Promise<void> {
    const manager = await this.prisma.user.findFirst({
      where: {
        id: managerId,
        tenantId: userTenantId,
        isActive: true,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!manager) {
      throw new ForbiddenException(
        'Manager does not belong to the current tenant.',
      );
    }
  }

  /**
   * Validate project date consistency.
   */
  private validateProjectDates(
    startDate?: string | null,
    endDate?: string | null,
  ): void {
    if (!startDate || !endDate) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }

    if (end < start) {
      throw new ConflictException(
        'Project end date cannot be before start date.',
      );
    }
  }
}
