import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { Prisma } from '@prisma/client';
import { GlService } from '../gl/gl.service';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly glService: GlService,
  ) {}

  async create(dto: CreateExpenseDto, userTenantId: string) {
    const expense = await this.prisma.expense.create({
      data: {
        expenseDate: new Date(dto.expenseDate),
        category: dto.category,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        paymentMethod: dto.paymentMethod,
        referenceNo: dto.referenceNo,
        notes: dto.notes,
        tenantId: userTenantId,
      },
    });

    return expense;
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

  async update(id: string, dto: UpdateExpenseDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        category: dto.category,
        description: dto.description,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        paymentMethod: dto.paymentMethod,
        referenceNo: dto.referenceNo,
        notes: dto.notes,
      },
    });

    return expense;
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    await this.prisma.expense.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Expense deleted successfully',
    };
  }
}
