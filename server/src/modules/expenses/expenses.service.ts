import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Prisma } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateExpenseDto, userTenantId: string, userId: string) {
    const expense = await this.prisma.expense.create({
      data: {
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        expenseDate: new Date(dto.expenseDate),
        category: dto.category,
        paymentMethod: dto.paymentMethod,
        vendor: dto.vendor,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        status: dto.status,
        tenantId: userTenantId,
        userId,
        vendorId: dto.vendorId,
      },
    });

    await this.activityLogs.create({
      action: 'CREATE',
      module: 'EXPENSES',
      description: `Expense "${expense.description}" created`,
      userId,
      tenantId: userTenantId,
    });

    return expense;
  }

  findAll(userTenantId: string) {
    return this.prisma.expense.findMany({
      where: {
        tenantId: userTenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async findOne(id: string, userTenantId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
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

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this expense');
    }

    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto, userTenantId: string, userId: string) {
    const expense = await this.findOne(id, userTenantId);

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        description: dto.description,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        category: dto.category,
        paymentMethod: dto.paymentMethod,
        vendor: dto.vendor,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        status: dto.status,
        vendorId: dto.vendorId,
      },
    });

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'EXPENSES',
      description: `Expense "${updatedExpense.description}" updated`,
      userId,
      tenantId: userTenantId,
    });

    return updatedExpense;
  }

  async remove(id: string, userTenantId: string, userId: string) {
    const expense = await this.findOne(id, userTenantId);

    await this.prisma.expense.delete({
      where: { id },
    });

    await this.activityLogs.create({
      action: 'DELETE',
      module: 'EXPENSES',
      description: `Expense "${expense.description}" deleted`,
      userId,
      tenantId: userTenantId,
    });

    return {
      message: 'Expense deleted successfully',
      id,
    };
  }
}
