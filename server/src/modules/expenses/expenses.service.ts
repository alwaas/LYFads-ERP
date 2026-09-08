import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { RecordExpensePaymentDto } from './dto/record-expense-payment.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { Prisma, ExpenseStatus, UserRole } from '@prisma/client';
import { GlService } from '../gl/gl.service';

type Decimalish = number | string | Prisma.Decimal;

const FINANCIAL_FIELDS = [
  'amount',
  'taxAmount',
  'paymentMethod',
  'vendorId',
  'employeeId',
  'glAccountId',
] as const;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly glService: GlService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private toDecimal(value?: Decimalish): Prisma.Decimal {
    if (value === undefined || value === null || value === '') {
      return new Prisma.Decimal(0);
    }
    return new Prisma.Decimal(value as number | string);
  }

  private readonly transitions: Record<ExpenseStatus, ExpenseStatus[]> = {
    [ExpenseStatus.DRAFT]: [ExpenseStatus.SUBMITTED, ExpenseStatus.CANCELLED],
    [ExpenseStatus.SUBMITTED]: [
      ExpenseStatus.APPROVED,
      ExpenseStatus.REJECTED,
      ExpenseStatus.CANCELLED,
    ],
    [ExpenseStatus.APPROVED]: [ExpenseStatus.POSTED, ExpenseStatus.CANCELLED],
    [ExpenseStatus.POSTED]: [ExpenseStatus.PAID],
    [ExpenseStatus.PAID]: [],
    [ExpenseStatus.REJECTED]: [],
    [ExpenseStatus.CANCELLED]: [],
  };

  private assertTransition(
    current: ExpenseStatus,
    target: ExpenseStatus,
  ): void {
    const allowed = this.transitions[current] ?? [];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Invalid expense status transition from ${current} to ${target}`,
      );
    }
  }

  private async logTransition(
    expenseId: string,
    action: string,
    description: string,
    userTenantId: string,
    userId?: string,
  ): Promise<void> {
    try {
      await this.activityLogs.create({
        action,
        module: 'EXPENSES',
        description,
        userId,
        tenantId: userTenantId,
      });
    } catch (err) {
      void err;
    }
  }

  private async validateReferences(
    vendorId?: string | null,
    employeeId?: string | null,
    glAccountId?: string | null,
    tenantId?: string,
  ): Promise<void> {
    if (vendorId) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, tenantId: true },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
      if (tenantId && vendor.tenantId !== tenantId) {
        throw new ForbiddenException('Access denied to this vendor');
      }
    }
    if (employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, tenantId: true },
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
      if (tenantId && employee.tenantId !== tenantId) {
        throw new ForbiddenException('Access denied to this employee');
      }
    }
    if (glAccountId) {
      const account = await this.prisma.account.findUnique({
        where: { id: glAccountId },
        select: { id: true, tenantId: true },
      });
      if (!account) {
        throw new NotFoundException('GL account not found');
      }
      if (tenantId && account.tenantId !== tenantId) {
        throw new ForbiddenException('Access denied to this GL account');
      }
    }
  }

  async create(
    dto: CreateExpenseDto,
    userTenantId: string,
    userId?: string,
  ) {
    await this.validateReferences(dto.vendorId, dto.employeeId, dto.glAccountId, userTenantId);

    const amountDec = this.toDecimal(dto.amount);
    const taxDec = dto.taxAmount != null ? this.toDecimal(dto.taxAmount) : this.toDecimal(0);
    const totalDec = taxDec.gt(0) ? amountDec.plus(taxDec) : amountDec;

    const expense = await this.prisma.expense.create({
      data: {
        expenseDate: new Date(dto.expenseDate),
        category: dto.category,
        description: dto.description,
        amount: amountDec,
        taxAmount: taxDec,
        total: totalDec,
        paymentMethod: dto.paymentMethod,
        referenceNo: dto.referenceNo,
        notes: dto.notes,
        receiptUrl: dto.receiptUrl,
        vendorId: dto.vendorId ?? undefined,
        employeeId: dto.employeeId ?? undefined,
        glAccountId: dto.glAccountId ?? undefined,
        createdById: userId,
        tenantId: userTenantId,
      },
    });

    await this.logTransition(
      expense.id,
      'CREATE',
      `Expense "${expense.description}" created`,
      userTenantId,
      userId,
    );

    return expense;
  }

  async findAll(query: ExpenseQueryDto, userTenantId: string) {
    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
      if (query.dateTo) dateFilter.lte = new Date(`${query.dateTo}T23:59:59`);
      where.expenseDate = dateFilter;
    }

    if (query.category) {
      where.category = { contains: query.category, mode: Prisma.QueryMode.insensitive };
    }

    if (query.method) {
      where.paymentMethod = query.method;
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { category: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { referenceNo: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy: {
          expenseDate: 'desc',
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      total,
      data,
    };
  }

  async findOne(id: string, userTenantId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this expense');
    }

    return expense;
  }

  async update(
    id: string,
    dto: UpdateExpenseDto,
    userTenantId: string,
    userId?: string,
    userRole?: string,
  ) {
    const expense = await this.findOne(id, userTenantId);

    if (userRole === UserRole.EMPLOYEE && expense.createdById && expense.createdById !== userId) {
      throw new ForbiddenException('You can only edit expenses you created');
    }

    if (
      expense.status !== ExpenseStatus.DRAFT &&
      (expense.status === ExpenseStatus.POSTED || expense.status === ExpenseStatus.PAID)
    ) {
      throw new ForbiddenException(
        `Cannot edit expense in ${expense.status} status; use the payment workflow instead`,
      );
    }

    const isLocked = (key: string) =>
      expense.status !== ExpenseStatus.DRAFT &&
      FINANCIAL_FIELDS.includes(key as (typeof FINANCIAL_FIELDS)[number]);

    const updates: Record<string, unknown> = {};

    if (dto.expenseDate) {
      updates.expenseDate = new Date(dto.expenseDate);
    }
    if (dto.category) {
      updates.category = dto.category;
    }
    if (dto.description) {
      updates.description = dto.description;
    }
    if (dto.amount) {
      if (isLocked('amount')) {
        throw new ForbiddenException('amount is locked after submission');
      }
      updates.amount = this.toDecimal(dto.amount);
    }
    if (dto.taxAmount) {
      if (isLocked('taxAmount')) {
        throw new ForbiddenException('taxAmount is locked after submission');
      }
      updates.taxAmount = this.toDecimal(dto.taxAmount);
    }
    if (dto.paymentMethod) {
      if (isLocked('paymentMethod')) {
        throw new ForbiddenException('paymentMethod is locked after submission');
      }
      updates.paymentMethod = dto.paymentMethod;
    }
    if (dto.vendorId !== undefined) {
      if (isLocked('vendorId')) {
        throw new ForbiddenException('vendorId is locked after submission');
      }
      await this.validateReferences(dto.vendorId, undefined, undefined, userTenantId);
      updates.vendorId = dto.vendorId;
    }
    if (dto.employeeId !== undefined) {
      if (isLocked('employeeId')) {
        throw new ForbiddenException('employeeId is locked after submission');
      }
      await this.validateReferences(undefined, dto.employeeId, undefined, userTenantId);
      updates.employeeId = dto.employeeId;
    }
    if (dto.glAccountId !== undefined) {
      if (isLocked('glAccountId')) {
        throw new ForbiddenException('glAccountId is locked after submission');
      }
      await this.validateReferences(undefined, undefined, dto.glAccountId, userTenantId);
      updates.glAccountId = dto.glAccountId;
    }
    if (dto.receiptUrl) {
      updates.receiptUrl = dto.receiptUrl;
    }
    if (dto.referenceNo !== undefined) {
      updates.referenceNo = dto.referenceNo;
    }
    if (dto.notes !== undefined) {
      updates.notes = dto.notes;
    }

    if (Object.keys(updates).length === 0) {
      return expense;
    }

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: updates,
    });

    await this.logTransition(
      expense.id,
      'UPDATE',
      `Expense "${updatedExpense.description}" updated (status: ${expense.status})`,
      userTenantId,
      userId,
    );

    return updatedExpense;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const expense = await this.findOne(id, userTenantId);

    await this.prisma.expense.delete({
      where: { id },
    });

    await this.logTransition(
      expense.id,
      'DELETE',
      `Expense "${expense.description}" deleted`,
      userTenantId,
      userId,
    );

    return {
      success: true,
      message: 'Expense deleted successfully',
    };
  }

  async postToLedger(id: string, userTenantId: string, userId?: string) {
    const expense = await this.findOne(id, userTenantId);

    await this.glService.postExpense(
      userTenantId,
      expense.id,
      expense.amount,
      userId,
      {
        glAccountId: expense.glAccountId,
        vendorId: expense.vendorId,
        taxAmount: expense.taxAmount,
      },
    );

    return this.findOne(id, userTenantId);
  }

  async submit(
    id: string,
    userTenantId: string,
    userId?: string,
    userRole?: string,
  ) {
    const expense = await this.findOne(id, userTenantId);

    if (userRole === UserRole.EMPLOYEE && expense.createdById && expense.createdById !== userId) {
      throw new ForbiddenException('You can only submit expenses you created');
    }

    this.assertTransition(expense.status, ExpenseStatus.SUBMITTED);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: { status: ExpenseStatus.SUBMITTED },
    });

    await this.logTransition(
      updated.id,
      'SUBMIT',
      `Expense "${updated.description}" submitted for approval`,
      userTenantId,
      userId,
    );

    return updated;
  }

  async approve(id: string, userTenantId: string, userId?: string) {
    const expense = await this.findOne(id, userTenantId);

    if (expense.createdById && expense.createdById === userId) {
      throw new ForbiddenException('You cannot approve your own expense');
    }

    this.assertTransition(expense.status, ExpenseStatus.APPROVED);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    await this.logTransition(
      updated.id,
      'APPROVE',
      `Expense "${updated.description}" approved by user ${userId}`,
      userTenantId,
      userId,
    );

    return updated;
  }

  async reject(id: string, userTenantId: string, userId?: string) {
    const expense = await this.findOne(id, userTenantId);

    if (expense.createdById && expense.createdById === userId) {
      throw new ForbiddenException('You cannot reject your own expense');
    }

    this.assertTransition(expense.status, ExpenseStatus.REJECTED);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.REJECTED,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    await this.logTransition(
      updated.id,
      'REJECT',
      `Expense "${updated.description}" rejected`,
      userTenantId,
      userId,
    );

    return updated;
  }

  async post(id: string, userTenantId: string, userId?: string) {
    const expense = await this.findOne(id, userTenantId);
    this.assertTransition(expense.status, ExpenseStatus.POSTED);

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: { status: ExpenseStatus.POSTED },
      });

      await this.glService.postExpense(
        userTenantId,
        expense.id,
        expense.amount,
        userId,
        {
          glAccountId: expense.glAccountId,
          vendorId: expense.vendorId,
          taxAmount: expense.taxAmount,
        },
      );
    });

    await this.logTransition(
      id,
      'POST',
      `Expense "${expense.description}" posted to GL`,
      userTenantId,
      userId,
    );

    return this.findOne(id, userTenantId);
  }

  async cancel(
    id: string,
    userTenantId: string,
    userId?: string,
    userRole?: string,
  ) {
    const expense = await this.findOne(id, userTenantId);

    if (userRole === UserRole.EMPLOYEE && expense.createdById && expense.createdById !== userId) {
      throw new ForbiddenException('You can only cancel expenses you created');
    }

    this.assertTransition(expense.status, ExpenseStatus.CANCELLED);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: { status: ExpenseStatus.CANCELLED },
    });

    await this.logTransition(
      updated.id,
      'CANCEL',
      `Expense "${updated.description}" cancelled`,
      userTenantId,
      userId,
    );

    return updated;
  }

  async recordPayment(
    id: string,
    dto: RecordExpensePaymentDto,
    userTenantId: string,
    userId?: string,
  ) {
    const expense = await this.findOne(id, userTenantId);

    if (expense.status !== ExpenseStatus.POSTED) {
      throw new BadRequestException(
        `Only POSTED expenses can be paid; current status: ${expense.status}`,
      );
    }

    const paymentAmount = this.toDecimal(dto.amount);
    if (paymentAmount.lte(0)) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const totalDec = expense.total ?? expense.amount;
    const alreadyPaid = expense.amountPaid ?? this.toDecimal(0);
    const remainingBalance = totalDec.minus(alreadyPaid);

    if (paymentAmount.gt(remainingBalance)) {
      throw new BadRequestException(
        `Payment amount ${paymentAmount.toString()} exceeds remaining balance ${remainingBalance.toString()}`,
      );
    }

    const newPaid = alreadyPaid.plus(paymentAmount);
    const balance = totalDec.minus(newPaid);

    const isFullyPaid = balance.lte(0);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        amountPaid: newPaid,
        balanceAmount: balance,
        paidAt: isFullyPaid ? new Date() : undefined,
        status: isFullyPaid ? ExpenseStatus.PAID : ExpenseStatus.POSTED,
        notes: dto.notes != null
          ? expense.notes
            ? `${expense.notes}\n${dto.notes}`
            : dto.notes
          : undefined,
      },
    });

    await this.logTransition(
      updated.id,
      'PAYMENT',
      `Payment of ${dto.amount} recorded against expense "${updated.description}"`,
      userTenantId,
      userId,
    );

    return updated;
  }
}
