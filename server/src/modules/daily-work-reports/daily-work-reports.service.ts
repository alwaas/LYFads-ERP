import {
  ConflictException,
  Injectable,
  NotFoundException,
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

  // =========================
  // CREATE
  // =========================
  async create(dto: CreateDailyWorkReportDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const reportDate = new Date(dto.reportDate);

    if (Number.isNaN(reportDate.getTime())) {
      throw new ConflictException('Invalid report date.');
    }

    reportDate.setHours(0, 0, 0, 0);

    const existingReport = await this.prisma.dailyWorkReport.findFirst({
      where: {
        employeeId: dto.employeeId,
        reportDate,
      },
    });

    if (existingReport) {
      throw new ConflictException(
        'Daily Work Report already exists for this employee and date.',
      );
    }

    const report = await this.prisma.dailyWorkReport.create({
      data: {
        employeeId: dto.employeeId,
        projectId: dto.projectId || null,
        taskId: dto.taskId || null,
        reportDate,
        yesterdayWork: dto.yesterdayWork || null,
        todayWork: dto.todayWork,
        tomorrowPlan: dto.tomorrowPlan || null,
        hoursWorked: new Prisma.Decimal(dto.hoursWorked),
        status: dto.status ?? WorkStatus.COMPLETED,
        managerRemarks: dto.managerRemarks || null,
        tenantId: employee.tenantId,
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
      userId: employee.userId,
      tenantId: employee.tenantId,
    });

    return report;
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, dto: UpdateDailyWorkReportDto) {
    const existingReport = await this.prisma.dailyWorkReport.findUnique({
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

    if (!existingReport) {
      throw new NotFoundException('Daily Work Report not found.');
    }

    let reportDate: Date | undefined;

    if (dto.reportDate !== undefined) {
      reportDate = new Date(dto.reportDate);

      if (Number.isNaN(reportDate.getTime())) {
        throw new ConflictException('Invalid report date.');
      }

      reportDate.setHours(0, 0, 0, 0);
    }

    const employeeId = dto.employeeId ?? existingReport.employeeId;

    if (
      dto.employeeId !== undefined &&
      dto.employeeId !== existingReport.employeeId
    ) {
      const employee = await this.prisma.employee.findUnique({
        where: {
          id: dto.employeeId,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found.');
      }
    }

    if (reportDate !== undefined || dto.employeeId !== undefined) {
      const duplicate = await this.prisma.dailyWorkReport.findFirst({
        where: {
          employeeId,
          reportDate: reportDate ?? existingReport.reportDate,
          NOT: {
            id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Daily Work Report already exists for this employee and date.',
        );
      }
    }

    const updatedReport = await this.prisma.dailyWorkReport.update({
      where: {
        id,
      },

      data: {
        ...(dto.employeeId !== undefined && {
          employeeId: dto.employeeId,
        }),

        ...(dto.projectId !== undefined && {
          projectId: dto.projectId || null,
        }),

        ...(dto.taskId !== undefined && {
          taskId: dto.taskId || null,
        }),

        ...(reportDate !== undefined && {
          reportDate,
        }),

        ...(dto.yesterdayWork !== undefined && {
          yesterdayWork: dto.yesterdayWork || null,
        }),

        ...(dto.todayWork !== undefined && {
          todayWork: dto.todayWork,
        }),

        ...(dto.tomorrowPlan !== undefined && {
          tomorrowPlan: dto.tomorrowPlan || null,
        }),

        ...(dto.hoursWorked !== undefined && {
          hoursWorked: new Prisma.Decimal(dto.hoursWorked),
        }),

        ...(dto.status !== undefined && {
          status: dto.status,
        }),

        ...(dto.managerRemarks !== undefined && {
          managerRemarks: dto.managerRemarks || null,
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

  // =========================
  // FIND ALL
  // =========================
  async findAll(pagination: PaginationDto, search: SearchDto) {
    const searchText = search.search?.trim();

    const where: Prisma.DailyWorkReportWhereInput = searchText
      ? {
          OR: [
            {
              todayWork: {
                contains: searchText,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              yesterdayWork: {
                contains: searchText,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              tomorrowPlan: {
                contains: searchText,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              employee: {
                user: {
                  fullName: {
                    contains: searchText,
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

  // =========================
  // FIND ONE
  // =========================
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

  // =========================
  // DELETE
  // =========================
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
