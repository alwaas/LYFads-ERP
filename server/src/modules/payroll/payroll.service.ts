import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreatePayrollDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const existing = await this.prisma.payroll.findFirst({
      where: {
        employeeId: dto.employeeId,
        month: dto.month,
        year: dto.year,
      },
    });

    if (existing) {
      throw new ConflictException('Payroll already generated for this month.');
    }

    const payroll = await this.prisma.payroll.create({
      data: {
        employeeId: dto.employeeId,
        month: dto.month,
        year: dto.year,
        basicSalary: dto.basicSalary,
        totalHours: dto.totalHours ?? 0,
        overtimeHours: dto.overtimeHours ?? 0,
        deductions: dto.deductions ?? 0,
        bonus: dto.bonus ?? 0,
        netSalary: dto.netSalary,
        status: dto.status ?? 'PENDING',
        tenantId: employee.user.tenantId,
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
      action: 'CREATE',
      module: 'PAYROLL',
      description: 'Payroll generated successfully.',
      userId: employee.userId,
    });

    return payroll;
  }

  async findAll(pagination: PaginationDto, search: SearchDto) {
    const { skip, limit } = pagination;

    const where: Prisma.PayrollWhereInput = search.search
      ? {
          employee: {
            user: {
              fullName: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payroll.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.payroll.count({
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
    const payroll = await this.prisma.payroll.findUnique({
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

    if (!payroll) {
      throw new NotFoundException('Payroll not found.');
    }

    return payroll;
  }

  async update(id: string, dto: UpdatePayrollDto) {
    await this.findOne(id);

    const payroll = await this.prisma.payroll.update({
      where: {
        id,
      },
      data: dto,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'PAYROLL',
      description: 'Payroll updated successfully.',
      userId: payroll.employee.userId,
    });

    return payroll;
  }

  async remove(id: string) {
    const payroll = await this.findOne(id);

    await this.prisma.payroll.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'PAYROLL',
      description: 'Payroll deleted successfully.',
      userId: payroll.employee.userId,
    });

    return {
      success: true,
      message: 'Payroll deleted successfully.',
    };
  }
}
