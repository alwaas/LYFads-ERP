import { Injectable, NotFoundException } from '@nestjs/common';

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
    console.log('========== TIMESHEET CREATE START ==========');
    console.log('DTO RECEIVED:', dto);

    try {
      console.log('1. Finding employee:', dto.employeeId);

      const employee = await this.prisma.employee.findUnique({
        where: {
          id: dto.employeeId,
        },
      });

      console.log('2. Employee:', employee);

      if (!employee) {
        throw new NotFoundException('Employee not found.');
      }

      console.log('3. Creating timesheet...');

      const timesheet = await this.prisma.timesheet.create({
        data: {
          ...dto,
          tenantId: employee.tenantId,
        },
        include: {
          employee: true,
          project: true,
          task: true,
        },
      });

      console.log('4. Timesheet created:', timesheet.id);

      console.log('5. Creating activity log...');

      await this.activityLogsService.log({
        action: 'CREATE',
        module: 'TIMESHEET',
        description: 'Timesheet created successfully.',
        userId: employee.userId,
      });

      console.log('6. Activity log created.');
      console.log('========== TIMESHEET CREATE SUCCESS ==========');

      return timesheet;
    } catch (error) {
      console.error('========== TIMESHEET CREATE ERROR ==========');
      console.error(error);
      console.error('=============================================');

      throw error;
    }
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
