import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { Prisma, WorkStatus } from '@prisma/client';

import { PrismaService } from '../../database';

import { CreateDailyWorkReportDto } from './dto/create-daily-work-report.dto';
import { UpdateDailyWorkReportDto } from './dto/update-daily-work-report.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class DailyWorkReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateDailyWorkReportDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const reportDate = new Date(dto.reportDate);
    reportDate.setHours(0, 0, 0, 0);

    const alreadyExists = await this.prisma.dailyWorkReport.findFirst({
      where: {
        employeeId: dto.employeeId,
        reportDate,
      },
    });

    if (alreadyExists) {
      throw new ConflictException(
        'Daily Work Report already exists for this date.',
      );
    }

    const report = await this.prisma.dailyWorkReport.create({
      data: {
        employeeId: dto.employeeId,
        projectId: dto.projectId || null,
        taskId: dto.taskId || null,
        reportDate,
        yesterdayWork: dto.yesterdayWork,
        todayWork: dto.todayWork,
        tomorrowPlan: dto.tomorrowPlan,
        hoursWorked: new Prisma.Decimal(dto.hoursWorked),
        status: dto.status ?? WorkStatus.COMPLETED,
        managerRemarks: dto.managerRemarks,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        project: true,
        task: true,
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'DAILY_WORK_REPORT',
      description: `Daily Work Report created.`,
      userId: report.employee.user.id,
    });

    return report;
  }

  async update(id: string, dto: UpdateDailyWorkReportDto) {
    const report = await this.prisma.dailyWorkReport.findUnique({
      where: {
        id,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Daily Work Report not found.');
    }

    const updatedReport = await this.prisma.dailyWorkReport.update({
      where: {
        id,
      },
      data: {
        ...(dto.projectId !== undefined && {
          projectId: dto.projectId || null,
        }),
        ...(dto.taskId !== undefined && {
          taskId: dto.taskId || null,
        }),
        ...(dto.reportDate && {
          reportDate: new Date(dto.reportDate),
        }),
        ...(dto.yesterdayWork !== undefined && {
          yesterdayWork: dto.yesterdayWork,
        }),
        ...(dto.todayWork !== undefined && {
          todayWork: dto.todayWork,
        }),
        ...(dto.tomorrowPlan !== undefined && {
          tomorrowPlan: dto.tomorrowPlan,
        }),
        ...(dto.hoursWorked !== undefined && {
          hoursWorked: new Prisma.Decimal(dto.hoursWorked),
        }),
        ...(dto.status && {
          status: dto.status,
        }),
        ...(dto.managerRemarks !== undefined && {
          managerRemarks: dto.managerRemarks,
        }),
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        project: true,
        task: true,
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'DAILY_WORK_REPORT',
      description: `Daily Work Report updated.`,
      userId: updatedReport.employee.user.id,
    });

    return updatedReport;
  }

  async findAll(pagination: PaginationDto, search: SearchDto) {
    const where: Prisma.DailyWorkReportWhereInput = search.search
      ? {
          OR: [
            {
              todayWork: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              employee: {
                user: {
                  fullName: {
                    contains: search.search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.dailyWorkReport.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: {
          reportDate: 'desc',
        },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          project: true,
          task: true,
        },
      }),
      this.prisma.dailyWorkReport.count({
        where,
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

  async findOne(id: string) {
    const report = await this.prisma.dailyWorkReport.findUnique({
      where: {
        id,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        project: true,
        task: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Daily Work Report not found.');
    }

    return report;
  }

  async delete(id: string) {
    const report = await this.prisma.dailyWorkReport.findUnique({
      where: {
        id,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Daily Work Report not found.');
    }

    await this.prisma.dailyWorkReport.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'DAILY_WORK_REPORT',
      description: `Daily Work Report deleted.`,
      userId: report.employee.user.id,
    });

    return {
      success: true,
      message: 'Daily Work Report deleted successfully.',
    };
  }
}
