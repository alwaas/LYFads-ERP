import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { TimesheetStatus } from '@prisma/client';

@Injectable()
export class TimesheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateTimesheetDto, userTenantId: string, userRole?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    if (userRole === 'EMPLOYEE' && employee.userId !== dto.employeeId) {
      throw new ForbiddenException('Employees can only create timesheets for themselves');
    }

    const timesheet = await this.prisma.timesheet.create({
      data: {
        employeeId: dto.employeeId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        workDate: new Date(dto.workDate),
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        hours: dto.hours,
        description: dto.description,
        tenantId: userTenantId,
      },
      include: {
        employee: true,
        project: true,
        task: true,
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'TIMESHEET',
      description: 'Timesheet created successfully.',
      userId: employee.userId,
      tenantId: userTenantId,
    });

    return timesheet;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (search.search) {
      where.employee = {
        is: {
          user: {
            is: {
              fullName: { contains: search.search, mode: 'insensitive' },
            },
          },
        },
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.timesheet.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
          project: true,
          task: true,
        },
        orderBy: {
          workDate: 'desc',
        },
      }),
      this.prisma.timesheet.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async findOne(id: string, userTenantId: string) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: {
        employee: true,
        project: true,
        task: true,
      },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // Verify tenant ownership
    if (timesheet.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this timesheet');
    }

    return timesheet;
  }

  async update(id: string, dto: UpdateTimesheetDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    const timesheet = await this.prisma.timesheet.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId,
        workDate: dto.workDate ? new Date(dto.workDate) : undefined,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        hours: dto.hours,
        description: dto.description,
      },
      include: {
        employee: true,
        project: true,
        task: true,
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'TIMESHEET',
      description: 'Timesheet updated successfully.',
      userId: timesheet.employee.userId,
      tenantId: userTenantId,
    });

    return timesheet;
  }

  async remove(id: string, userTenantId: string) {
    const timesheet = await this.findOne(id, userTenantId);

    await this.prisma.timesheet.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'TIMESHEET',
      description: 'Timesheet deleted successfully.',
      userId: timesheet.employee.userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Timesheet deleted successfully.',
    };
  }

  async employeeSummary(employeeId: string, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { tenantId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Verify employee belongs to the same tenant
    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    return this.prisma.timesheet.aggregate({
      where: {
        employeeId,
        tenantId: userTenantId,
      },
      _sum: {
        hours: true,
      },
      _count: true,
    });
  }

  async projectSummary(projectId: string, userTenantId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { tenantId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify project belongs to the same tenant
    if (project.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this project');
    }

    return this.prisma.timesheet.aggregate({
      where: {
        projectId,
        tenantId: userTenantId,
      },
      _sum: {
        hours: true,
      },
      _count: true,
    });
  }

  async updateStatus(id: string, status: string, userTenantId: string, userId?: string, rejectionReason?: string) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this timesheet');
    }

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['APPROVED', 'REJECTED'],
      APPROVED: [],
      REJECTED: ['SUBMITTED'],
    };

    const currentStatus = timesheet.status as TimesheetStatus;
    const nextStatus = status as TimesheetStatus;

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      throw new ConflictException(`Invalid transition from ${currentStatus} to ${nextStatus}`);
    }

    if (nextStatus === TimesheetStatus.APPROVED || nextStatus === TimesheetStatus.REJECTED) {
      if (!userId) {
        throw new ForbiddenException('User ID is required for approval/rejection');
      }

      if (timesheet.employee.userId === userId) {
        throw new ForbiddenException('Employee cannot approve/reject own timesheet');
      }
    }

    const data: Record<string, unknown> = {
      status: nextStatus,
    };

    if (nextStatus === TimesheetStatus.APPROVED || nextStatus === TimesheetStatus.REJECTED) {
      data.approvedById = userId;
      data.approvedAt = new Date();
    }

    if (nextStatus === TimesheetStatus.REJECTED) {
      data.rejectionReason = rejectionReason || 'Rejected by manager';
    }

    const updated = await this.prisma.timesheet.update({
      where: { id },
      data,
      include: {
        employee: true,
        project: true,
        task: true,
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'STATUS_UPDATE',
      module: 'TIMESHEET',
      description: `Timesheet status updated to ${nextStatus}`,
      userId: timesheet.employee.userId,
      tenantId: userTenantId,
    });

    return updated;
  }
}
