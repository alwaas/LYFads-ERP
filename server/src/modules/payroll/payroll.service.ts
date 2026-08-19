import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
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

  async create(dto: CreatePayrollDto, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    // Verify employee belongs to the same tenant
    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const existing = await this.prisma.payroll.findFirst({
      where: {
        employeeId: dto.employeeId,
        month: dto.month,
        year: dto.year,
        tenantId: userTenantId,
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
        basicSalary: new Prisma.Decimal(dto.basicSalary),
        totalHours: dto.totalHours
          ? new Prisma.Decimal(dto.totalHours)
          : new Prisma.Decimal(0),
        overtimeHours: dto.overtimeHours
          ? new Prisma.Decimal(dto.overtimeHours)
          : new Prisma.Decimal(0),
        overtimeAmount: dto.overtimeAmount
          ? new Prisma.Decimal(dto.overtimeAmount)
          : new Prisma.Decimal(0),
        hra: dto.hra ? new Prisma.Decimal(dto.hra) : new Prisma.Decimal(0),
        allowances: dto.allowances
          ? new Prisma.Decimal(dto.allowances)
          : new Prisma.Decimal(0),
        bonus: dto.bonus
          ? new Prisma.Decimal(dto.bonus)
          : new Prisma.Decimal(0),
        incentives: dto.incentives
          ? new Prisma.Decimal(dto.incentives)
          : new Prisma.Decimal(0),
        grossSalary: dto.grossSalary
          ? new Prisma.Decimal(dto.grossSalary)
          : new Prisma.Decimal(0),
        pf: dto.pf ? new Prisma.Decimal(dto.pf) : new Prisma.Decimal(0),
        esi: dto.esi ? new Prisma.Decimal(dto.esi) : new Prisma.Decimal(0),
        tds: dto.tds ? new Prisma.Decimal(dto.tds) : new Prisma.Decimal(0),
        deductions: dto.deductions
          ? new Prisma.Decimal(dto.deductions)
          : new Prisma.Decimal(0),
        totalDeduction: dto.totalDeduction
          ? new Prisma.Decimal(dto.totalDeduction)
          : new Prisma.Decimal(0),
        netSalary: new Prisma.Decimal(dto.netSalary),
        status: dto.status ?? 'PENDING',
        payslipNo: dto.payslipNo,
        tenantId: userTenantId,
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
      tenantId: userTenantId,
    });

    return payroll;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.PayrollWhereInput = search.search
      ? {
          tenantId: userTenantId,
          employee: {
            user: {
              fullName: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {
          tenantId: userTenantId,
        };

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

  async findOne(id: string, userTenantId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }

    // Verify tenant ownership
    if (payroll.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payroll');
    }

    return payroll;
  }

  async update(id: string, dto: UpdatePayrollDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    const data: Prisma.PayrollUpdateInput = {};

    if (dto.basicSalary !== undefined)
      data.basicSalary = new Prisma.Decimal(dto.basicSalary);
    if (dto.totalHours !== undefined)
      data.totalHours = new Prisma.Decimal(dto.totalHours);
    if (dto.overtimeHours !== undefined)
      data.overtimeHours = new Prisma.Decimal(dto.overtimeHours);
    if (dto.overtimeAmount !== undefined)
      data.overtimeAmount = new Prisma.Decimal(dto.overtimeAmount);
    if (dto.hra !== undefined) data.hra = new Prisma.Decimal(dto.hra);
    if (dto.allowances !== undefined)
      data.allowances = new Prisma.Decimal(dto.allowances);
    if (dto.bonus !== undefined) data.bonus = new Prisma.Decimal(dto.bonus);
    if (dto.incentives !== undefined)
      data.incentives = new Prisma.Decimal(dto.incentives);
    if (dto.grossSalary !== undefined)
      data.grossSalary = new Prisma.Decimal(dto.grossSalary);
    if (dto.pf !== undefined) data.pf = new Prisma.Decimal(dto.pf);
    if (dto.esi !== undefined) data.esi = new Prisma.Decimal(dto.esi);
    if (dto.tds !== undefined) data.tds = new Prisma.Decimal(dto.tds);
    if (dto.deductions !== undefined)
      data.deductions = new Prisma.Decimal(dto.deductions);
    if (dto.totalDeduction !== undefined)
      data.totalDeduction = new Prisma.Decimal(dto.totalDeduction);
    if (dto.netSalary !== undefined)
      data.netSalary = new Prisma.Decimal(dto.netSalary);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.payslipNo !== undefined) data.payslipNo = dto.payslipNo;
    if (dto.generatedAt !== undefined)
      data.generatedAt = dto.generatedAt ? new Date(dto.generatedAt) : null;
    if (dto.paidAt !== undefined)
      data.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;

    const payroll = await this.prisma.payroll.update({
      where: {
        id,
      },
      data,
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
      tenantId: userTenantId,
    });

    return payroll;
  }

  async remove(id: string, userTenantId: string) {
    const payroll = await this.findOne(id, userTenantId);

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
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Payroll deleted successfully',
    };
  }
}
