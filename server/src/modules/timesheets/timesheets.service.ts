import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';

@Injectable()
export class TimesheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateTimesheetDto, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    // Verify employee belongs to the same tenant
    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
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

  findAll(userTenantId: string) {
    return this.prisma.timesheet.findMany({
      where: {
        tenantId: userTenantId,
      },
      include: {
        employee: true,
        project: true,
        task: true,
      },
      orderBy: {
        workDate: 'desc',
      },
    });
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
}
