import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreateLeaveBalanceDto } from './dto/create-leave-balance.dto';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveBalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaveBalanceDto, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      select: { tenantId: true },
    });

    if (!employee || employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const balance = await this.prisma.leaveBalance.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        year: dto.year,
        allocated: dto.allocated ?? 0,
        used: 0,
        remaining: dto.allocated ?? 0,
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

    return balance;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = { tenantId: userTenantId };

    if (search.search) {
      where.employee = {
        is: {
          user: {
            is: {
              fullName: { contains: search.search, mode: Prisma.QueryMode.insensitive },
            },
          },
        },
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.leaveBalance.findMany({
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveBalance.count({ where }),
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
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { id },
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

    if (!balance) {
      throw new NotFoundException('Leave balance not found');
    }

    if (balance.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this leave balance');
    }

    return balance;
  }

  async update(id: string, dto: UpdateLeaveBalanceDto, userTenantId: string) {
    const balance = await this.findOne(id, userTenantId);

    const updated = await this.prisma.leaveBalance.update({
      where: { id },
      data: {
        allocated: dto.allocated ?? balance.allocated,
        used: dto.used ?? balance.used,
        remaining: dto.remaining ?? balance.remaining,
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

    return updated;
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    await this.prisma.leaveBalance.delete({
      where: { id },
    });

    return { success: true, message: 'Leave balance deleted successfully' };
  }

  async findByEmployee(employeeId: string, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { tenantId: true },
    });

    if (!employee || employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    return this.prisma.leaveBalance.findMany({
      where: { employeeId, tenantId: userTenantId },
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
  }
}
