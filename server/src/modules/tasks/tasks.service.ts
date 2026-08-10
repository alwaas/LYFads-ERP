import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';

import { PrismaService } from '../../database';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type AuthenticatedUser = {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  private getUserId(user?: AuthenticatedUser): string | undefined {
    return user?.id ?? user?.userId;
  }

  async create(
    dto: CreateTaskDto,
    currentUser?: AuthenticatedUser,
  ) {
    const existingTask = await this.prisma.task.findUnique({
      where: {
        taskCode: dto.taskCode,
      },
    });

    if (existingTask) {
      throw new ConflictException(
        'Task code already exists.',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found.',
      );
    }

    if (dto.employeeId) {
      const employee =
        await this.prisma.employee.findUnique({
          where: {
            id: dto.employeeId,
          },
        });

      if (!employee) {
        throw new NotFoundException(
          'Employee not found.',
        );
      }
    }

    const task = await this.prisma.task.create({
      data: {
        taskCode: dto.taskCode,
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        employeeId: dto.employeeId,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate
          ? new Date(dto.dueDate)
          : undefined,
        estimatedHours: dto.estimatedHours,
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
        employee: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'TASK',
      description:
        `Task "${task.title}" created successfully.`,
      userId: this.getUserId(currentUser),
    });

    return task;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.TaskWhereInput = search.search
      ? {
          OR: [
            {
              title: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              taskCode: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [data, total] =
      await this.prisma.$transaction([
        this.prisma.task.findMany({
          where,
          skip,
          take: limit,
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
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
          orderBy: {
            createdAt: 'desc',
          },
        }),

        this.prisma.task.count({
          where,
        }),
      ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(
        total / pagination.limit,
      ),
      data,
    };
  }

  async findOne(id: string) {
    const task =
      await this.prisma.task.findUnique({
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
          employee: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found.',
      );
    }

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    currentUser?: AuthenticatedUser,
  ) {
    await this.findOne(id);

    if (dto.taskCode) {
      const duplicate =
        await this.prisma.task.findFirst({
          where: {
            taskCode: dto.taskCode,
            NOT: {
              id,
            },
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'Task code already exists.',
        );
      }
    }

    if (dto.projectId) {
      const project =
        await this.prisma.project.findUnique({
          where: {
            id: dto.projectId,
          },
        });

      if (!project) {
        throw new NotFoundException(
          'Project not found.',
        );
      }
    }

    if (dto.employeeId) {
      const employee =
        await this.prisma.employee.findUnique({
          where: {
            id: dto.employeeId,
          },
        });

      if (!employee) {
        throw new NotFoundException(
          'Employee not found.',
        );
      }
    }

    const data: Prisma.TaskUpdateInput = {};

    if (dto.taskCode !== undefined) {
      data.taskCode = dto.taskCode;
    }

    if (dto.title !== undefined) {
      data.title = dto.title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.projectId !== undefined) {
      data.project = {
        connect: {
          id: dto.projectId,
        },
      };
    }

    if (dto.employeeId !== undefined) {
      data.employee = dto.employeeId
        ? {
            connect: {
              id: dto.employeeId,
            },
          }
        : {
            disconnect: true,
          };
    }

    if (dto.status !== undefined) {
      data.status = dto.status as TaskStatus;
    }

    if (dto.priority !== undefined) {
      data.priority =
        dto.priority as TaskPriority;
    }

    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : null;
    }

    if (dto.estimatedHours !== undefined) {
      data.estimatedHours =
        dto.estimatedHours;
    }

    const task =
      await this.prisma.task.update({
        where: {
          id,
        },
        data,
        include: {
          project: {
            select: {
              id: true,
              projectCode: true,
              name: true,
            },
          },
          employee: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'TASK',
      description:
        `Task "${task.title}" updated successfully.`,
      userId: this.getUserId(currentUser),
    });

    return task;
  }

  async remove(
    id: string,
    currentUser?: AuthenticatedUser,
  ) {
    const task = await this.findOne(id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'TASK',
      description:
        `Task "${task.title}" deleted successfully.`,
      userId: this.getUserId(currentUser),
    });

    return {
      success: true,
      message: 'Task deleted successfully.',
    };
  }
}
