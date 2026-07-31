import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreateTaskDto } from './dto/create-task.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Prisma } from '@prisma/client';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateTaskDto) {
    const existingTask = await this.prisma.task.findUnique({
      where: {
        taskCode: dto.taskCode,
      },
    });

    if (existingTask) {
      throw new ConflictException('Task code already exists.');
    }

    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: {
          id: dto.employeeId,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found.');
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
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
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
      description: `Task "${task.title}" created successfully.`,
      userId: task.employee?.user?.id ?? undefined,
    });

    return task;
  }

  async findAll(pagination: PaginationDto, search: SearchDto) {
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

    const [data, total] = await this.prisma.$transaction([
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
      this.prisma.task.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
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
      throw new NotFoundException('Task not found.');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found.');
      }
    }

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found.');
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        project: true,
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'TASK',
      description: `Task "${updatedTask.title}" updated successfully.`,
      userId: updatedTask.employee?.user?.id ?? undefined,
    });

    return updatedTask;
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.prisma.task.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'TASK',
      description: `Task "${task.title}" deleted successfully.`,
      userId: task.employeeId ?? undefined,
    });

    return {
      success: true,
      message: 'Task deleted successfully.',
    };
  }
}
