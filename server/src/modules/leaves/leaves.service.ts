import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { Prisma } from '@prisma/client';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateLeaveDto, userTenantId: string, userRole?: string) {
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
      throw new ForbiddenException('Employees can only create leave requests for themselves');
    }

    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new ConflictException(
        'End date cannot be earlier than start date.',
      );
    }

    const overlap = await this.prisma.leave.findFirst({
      where: {
        employeeId: dto.employeeId,
        tenantId: userTenantId,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            startDate: {
              lte: new Date(dto.endDate),
            },
            endDate: {
              gte: new Date(dto.startDate),
            },
          },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException(
        'Leave request already exists for selected dates.',
      );
    }

    const leave = await this.prisma.leave.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        remarks: dto.remarks,
        tenantId: userTenantId,
      },
      include: {
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
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'LEAVE',
      description: 'Leave request created.',
      userId: employee.userId,
      tenantId: userTenantId,
    });

    return leave;
  }

  async update(id: string, dto: UpdateLeaveDto, userTenantId: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found.');
    }

    // Verify tenant ownership
    if (leave.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this leave request');
    }

    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) < new Date(dto.startDate)
    ) {
      throw new ConflictException(
        'End date cannot be earlier than start date.',
      );
    }

    const updatedLeave = await this.prisma.leave.update({
      where: {
        id,
      },
      data: {
        ...(dto.leaveType && {
          leaveType: dto.leaveType,
        }),
        ...(dto.startDate && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate && {
          endDate: new Date(dto.endDate),
        }),
        ...(dto.reason !== undefined && {
          reason: dto.reason,
        }),
        ...(dto.remarks !== undefined && {
          remarks: dto.remarks,
        }),
      },
      include: {
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
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'LEAVE',
      description: 'Leave request updated.',
      userId: updatedLeave.employee.user.id,
      tenantId: userTenantId,
    });

    return updatedLeave;
  }

  async updateStatus(
    id: string,
    dto: UpdateLeaveStatusDto,
    userTenantId: string,
    userId?: string,
  ) {
    const leave = await this.prisma.leave.findUnique({
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

    if (!leave) {
      throw new NotFoundException('Leave request not found.');
    }

    if (leave.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this leave request');
    }

    if (leave.employee.userId === userId && (dto.status === LeaveStatus.APPROVED || dto.status === LeaveStatus.REJECTED)) {
      throw new ForbiddenException('Employee cannot approve or reject own leave');
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
      APPROVED: ['CANCELLED'],
      REJECTED: [],
      CANCELLED: [],
    };

    const currentStatus = leave.status;
    const nextStatus = dto.status;

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      throw new ConflictException(`Invalid transition from ${currentStatus} to ${nextStatus}`);
    }

    const data: Record<string, unknown> = {
      status: dto.status,
      remarks: dto.remarks ?? leave.remarks,
    };

    if (dto.status === LeaveStatus.APPROVED || dto.status === LeaveStatus.REJECTED) {
      if (!userId) {
        throw new ForbiddenException('User ID is required for approval/rejection');
      }
      data.approvedById = userId;
      data.approvedAt = new Date();
    }

    if (dto.status === LeaveStatus.REJECTED) {
      if (!dto.rejectionReason) {
        throw new ForbiddenException('Rejection reason is required when rejecting leave');
      }
      data.rejectionReason = dto.rejectionReason;
    }

    if (dto.status === LeaveStatus.APPROVED) {
      const leaveDays = this.calculateLeaveDays(leave.startDate, leave.endDate);
      const balance = await this.prisma.leaveBalance.findFirst({
        where: {
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          year: leave.startDate.getFullYear(),
          tenantId: userTenantId,
        },
      });

      if (!balance || balance.remaining < leaveDays) {
        throw new ConflictException('Insufficient leave balance for this leave type');
      }

      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: { increment: leaveDays },
          remaining: { decrement: leaveDays },
        },
      });
    }

    if (dto.status === LeaveStatus.CANCELLED || dto.status === LeaveStatus.REJECTED) {
      const existingBalance = await this.prisma.leaveBalance.findFirst({
        where: {
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          year: leave.startDate.getFullYear(),
          tenantId: userTenantId,
        },
      });

      if (existingBalance && leave.status === LeaveStatus.APPROVED) {
        const leaveDays = this.calculateLeaveDays(leave.startDate, leave.endDate);
        await this.prisma.leaveBalance.update({
          where: { id: existingBalance.id },
          data: {
            used: { decrement: leaveDays },
            remaining: { increment: leaveDays },
          },
        });
      }
    }

    const updatedLeave = await this.prisma.leave.update({
      where: {
        id,
      },
      data,
      include: {
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
      module: 'LEAVE',
      description: `Leave ${dto.status}.`,
      userId: updatedLeave.employee.user.id,
      tenantId: userTenantId,
    });

    return updatedLeave;
  }

  private calculateLeaveDays(startDate: Date, endDate: Date): number {
    const diff = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    status?: string,
    leaveType?: string,
    userTenantId?: string,
  ) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      ...(userTenantId ? { tenantId: userTenantId } : {}),
    };

    if (search.search) {
      where.OR = [
        {
          reason: {
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
      ];
    }

    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

    if (leaveType && ['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'MATERNITY', 'PATERNITY'].includes(leaveType)) {
      where.leaveType = leaveType;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.leave.findMany({
        where,
        skip,
        take: limit,
        include: {
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
      this.prisma.leave.count({
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
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },
      include: {
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
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found.');
    }

    // Verify tenant ownership
    if (leave.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this leave request');
    }

    return leave;
  }
}
