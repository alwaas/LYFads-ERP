import {
  Injectable,
  NotFoundException,
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

  async create(dto: CreateTimesheetDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const timesheet = await this.prisma.timesheet.create({
      data: dto,
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
    });

    return timesheet;
  }

  findAll() {
    return this.prisma.timesheet.findMany({
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

  async findOne(id: string) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: {
        employee: true,
        project: true,
        task: true,
      },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found.');
    }

    return timesheet;
  }

  async update(id: string, dto: UpdateTimesheetDto) {
    await this.findOne(id);

    const timesheet = await this.prisma.timesheet.update({
      where: { id },
      data: dto,
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
    });

    return timesheet;
  }

  async remove(id: string) {
    const timesheet = await this.findOne(id);

    await this.prisma.timesheet.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'TIMESHEET',
      description: 'Timesheet deleted successfully.',
      userId: timesheet.employee.userId,
    });

    return {
      success: true,
      message: 'Timesheet deleted successfully.',
    };
  }

  employeeSummary(employeeId: string) {
    return this.prisma.timesheet.aggregate({
      where: {
        employeeId,
      },
      _sum: {
        hours: true,
      },
      _count: true,
    });
  }

  projectSummary(projectId: string) {
    return this.prisma.timesheet.aggregate({
      where: {
        projectId,
      },
      _sum: {
        hours: true,
      },
      _count: true,
    });
  }
}
