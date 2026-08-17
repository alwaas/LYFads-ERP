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

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateLeaveDto, userTenantId: string) {
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

    // Verify tenant ownership
    if (leave.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this leave request');
    }

    const updatedLeave = await this.prisma.leave.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
        remarks: dto.remarks ?? leave.remarks,
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
      action: 'STATUS_UPDATE',
      module: 'LEAVE',
      description: `Leave ${dto.status}.`,
      userId: updatedLeave.employee.user.id,
      tenantId: userTenantId,
    });

    return updatedLeave;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.LeaveWhereInput = search.search
      ? {
          tenantId: userTenantId,
          OR: [
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
          ],
        }
      : {
          tenantId: userTenantId,
        };

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
