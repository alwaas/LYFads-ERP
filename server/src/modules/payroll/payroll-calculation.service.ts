import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PayrollStatus, LeaveType } from '@prisma/client';

@Injectable()
export class PayrollCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  async calculatePayroll(tenantId: string, employeeId: string, month: number, year: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!employee || employee.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const existing = await this.prisma.payroll.findFirst({
      where: {
        employeeId,
        month,
        year,
        tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('Payroll already generated for this month.');
    }

    const salaryStructure = await this.prisma.salaryStructure.findFirst({
      where: {
        employeeId,
        tenantId,
        isActive: true,
        effectiveFrom: {
          lte: new Date(year, month - 1, 1),
        },
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (!salaryStructure) {
      throw new NotFoundException('No active salary structure found for this employee');
    }

    const attendanceData = await this.getAttendanceData(tenantId, employeeId, month, year);
    const timesheetData = await this.getTimesheetData(tenantId, employeeId, month, year);

    const totalWorkingDays = attendanceData.totalDays || 0;
    const presentDays = attendanceData.presentDays || 0;
    const totalApprovedHours = timesheetData.totalApprovedHours || 0;
    const normalHours = presentDays * 8;
    const approvedOvertimeHours = Math.max(0, totalApprovedHours - normalHours);

    const basicSalary = salaryStructure.basicSalary;
    const hra = salaryStructure.hra;
    const allowances = salaryStructure.allowances;
    const bonus = salaryStructure.bonus;
    const incentives = salaryStructure.incentives;
    const deductions = salaryStructure.deductions;

    const grossSalary = basicSalary.add(hra).add(allowances).add(bonus).add(incentives);

    const overtimeRate = basicSalary.div(30).div(8);
    const overtimeAmount = overtimeRate.mul(approvedOvertimeHours);

    const pf = basicSalary.mul(0.12);
    const esi = grossSalary.mul(0.0075);
    const tds = grossSalary.mul(0.10);

    const totalDeduction = deductions.add(pf).add(esi).add(tds);
    const netSalary = grossSalary.add(overtimeAmount).sub(totalDeduction);

    const payslipNo = `PS-${year}${String(month).padStart(2, '0')}-${employee.employeeCode}`;

    const payroll = await this.prisma.$transaction(async (tx) => {
      const createdPayroll = await tx.payroll.create({
        data: {
          employeeId,
          month,
          year,
          basicSalary,
          totalHours: new Prisma.Decimal(presentDays * 8),
          overtimeHours: new Prisma.Decimal(approvedOvertimeHours),
          overtimeAmount,
          hra,
          allowances,
          bonus,
          incentives,
          grossSalary,
          pf,
          esi,
          tds,
          deductions,
          totalDeduction,
          netSalary,
          status: PayrollStatus.PENDING,
          payslipNo,
          tenantId,
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

      const payrollItems: Prisma.PayrollItemCreateManyInput[] = [];

      if (basicSalary.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'EARNING',
          category: 'Basic Salary',
          description: 'Monthly basic salary',
          amount: basicSalary,
          sequence: 1,
          tenantId,
        });
      }

      if (hra.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'EARNING',
          category: 'HRA',
          description: 'House Rent Allowance',
          amount: hra,
          sequence: 2,
          tenantId,
        });
      }

      if (allowances.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'EARNING',
          category: 'Allowances',
          description: 'Various allowances',
          amount: allowances,
          sequence: 3,
          tenantId,
        });
      }

      if (bonus.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'EARNING',
          category: 'Bonus',
          description: 'Performance bonus',
          amount: bonus,
          sequence: 4,
          tenantId,
        });
      }

      if (incentives.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'EARNING',
          category: 'Incentives',
          description: 'Performance incentives',
          amount: incentives,
          sequence: 5,
          tenantId,
        });
      }

      if (overtimeAmount.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'EARNING',
          category: 'Overtime',
          description: `Overtime for ${approvedOvertimeHours} hours`,
          amount: overtimeAmount,
          sequence: 6,
          tenantId,
        });
      }

      if (pf.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'DEDUCTION',
          category: 'PF',
          description: 'Provident Fund (12% of basic)',
          amount: pf,
          sequence: 101,
          tenantId,
        });
      }

      if (esi.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'DEDUCTION',
          category: 'ESI',
          description: 'Employee State Insurance (0.75% of gross)',
          amount: esi,
          sequence: 102,
          tenantId,
        });
      }

      if (tds.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'DEDUCTION',
          category: 'TDS',
          description: 'Tax Deduction at Source (10% of gross)',
          amount: tds,
          sequence: 103,
          tenantId,
        });
      }

      if (deductions.gt(0)) {
        payrollItems.push({
          payrollId: createdPayroll.id,
          type: 'DEDUCTION',
          category: 'Other Deductions',
          description: 'Other deductions',
          amount: deductions,
          sequence: 104,
          tenantId,
        });
      }

      if (payrollItems.length > 0) {
        await tx.payrollItem.createMany({
          data: payrollItems,
        });
      }

      return createdPayroll;
    });

    await this.prisma.activityLog.create({
      data: {
        action: 'CREATE',
        module: 'PAYROLL',
        description: `Payroll calculated for ${employee.user.fullName} - ${month}/${year}`,
        userId: employee.userId,
        tenantId,
      },
    });

    return payroll;
  }

  private async getAttendanceData(tenantId: string, employeeId: string, month: number, year: string | number) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const presentDays = attendance.filter((a) => a.status === 'PRESENT').length;
    const totalDays = attendance.length;

    return { presentDays, totalDays };
  }

  private async getTimesheetData(tenantId: string, employeeId: string, month: number, year: string | number) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const approvedTimesheets = await this.prisma.timesheet.findMany({
      where: {
        tenantId,
        employeeId,
        workDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'APPROVED',
      },
    });

    const totalApprovedHours = approvedTimesheets.reduce((sum, t) => sum + Number(t.hours), 0);

    return { totalApprovedHours };
  }
}
