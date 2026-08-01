import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePayrollDto) {
    return this.prisma.payroll.create({
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
      },
    });
  }

  findAll() {
    return this.prisma.payroll.findMany({
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
    });
  }

  findOne(id: string) {
    return this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  update(id: string, dto: Partial<CreatePayrollDto>) {
    return this.prisma.payroll.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  remove(id: string) {
    return this.prisma.payroll.delete({
      where: { id },
    });
  }
}