import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { Prisma, WorkStatus } from '@prisma/client';

import { PrismaService } from '../../database';

import { CreateDailyWorkReportDto } from './dto/create-daily-work-report.dto';
import { UpdateDailyWorkReportDto } from './dto/update-daily-work-report.dto';
import { UpdateDailyWorkReportStatusDto } from './dto/update-daily-work-report-status.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class DailyWorkReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateDailyWorkReportDto, userTenantId: string) {
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

    // Verify employee belongs to the same tenant
    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const reportDate = new Date(dto.reportDate);

    if (Number.isNaN(reportDate.getTime())) {
      throw new ConflictException('Invalid report date.');
    }

    reportDate.setHours(0, 0, 0, 0);

    const existingReport = await this.prisma.dailyWorkReport.findFirst({
      where: {
        employeeId: dto.employeeId,
        tenantId: userTenantId,
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
        tenantId: userTenantId,
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
      tenantId: userTenantId,
    });

    return report;
  }

  async update(
    id: string,
    dto: UpdateDailyWorkReportDto,
    userTenantId: string,
  ) {
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

    // Verify tenant ownership
    if (existingReport.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this daily work report');
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

      // Verify employee belongs to the same tenant
      if (employee.tenantId !== userTenantId) {
        throw new ForbiddenException('Access denied to this employee');
      }
    }

    if (reportDate !== undefined || dto.employeeId !== undefined) {
      const duplicate = await this.prisma.dailyWorkReport.findFirst({
        where: {
          employeeId,
          tenantId: userTenantId,
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
      tenantId: userTenantId,
    });

    return updatedReport;
  }

  async updateStatus(
    id: string,
    dto: UpdateDailyWorkReportStatusDto,
    userTenantId: string,
  ) {
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

    // Verify tenant ownership
    if (report.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this daily work report');
    }

    const updatedReport = await this.prisma.dailyWorkReport.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
        managerRemarks: dto.managerRemarks,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'STATUS_UPDATE',
      module: 'DAILY_WORK_REPORT',
      description: `Daily Work Report status updated to ${dto.status}.`,
      userId: report.employee.user.id,
      tenantId: userTenantId,
    });

    return updatedReport;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.DailyWorkReportWhereInput = search.search
      ? {
          tenantId: userTenantId,
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
      : {
          tenantId: userTenantId,
        };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.dailyWorkReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          project: true,
          task: true,
        },
        orderBy: {
          reportDate: 'desc',
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

  async findOne(id: string, userTenantId: string) {
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

    // Verify tenant ownership
    if (report.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this daily work report');
    }

    return report;
  }

  async remove(id: string, userTenantId: string) {
    const report = await this.findOne(id, userTenantId);

    await this.prisma.dailyWorkReport.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'DAILY_WORK_REPORT',
      description: 'Daily Work Report deleted.',
      userId: report.employee.user.id,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Daily Work Report deleted successfully.',
    };
  }
}
