import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { UpdatePayrollItemDto } from './dto/update-payroll-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PayrollItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePayrollItemDto, userTenantId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: dto.payrollId },
      select: { tenantId: true },
    });

    if (!payroll || payroll.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payroll');
    }

    const item = await this.prisma.payrollItem.create({
      data: {
        payrollId: dto.payrollId,
        type: dto.type,
        category: dto.category,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        sequence: dto.sequence ?? 0,
        tenantId: userTenantId,
      },
    });

    return item;
  }

  async findAll(pagination: any, search: any, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = { tenantId: userTenantId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payrollItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          payroll: {
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
          },
        },
        orderBy: { sequence: 'asc' },
      }),
      this.prisma.payrollItem.count({ where }),
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
    const item = await this.prisma.payrollItem.findUnique({
      where: { id },
      include: {
        payroll: {
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
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Payroll item not found');
    }

    if (item.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payroll item');
    }

    return item;
  }

  async update(id: string, dto: UpdatePayrollItemDto, userTenantId: string) {
    const item = await this.findOne(id, userTenantId);

    const data: Record<string, unknown> = {};

    if (dto.type !== undefined) data.type = dto.type;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.sequence !== undefined) data.sequence = dto.sequence;

    const updated = await this.prisma.payrollItem.update({
      where: { id },
      data,
      include: {
        payroll: {
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
        },
      },
    });

    return updated;
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    await this.prisma.payrollItem.delete({
      where: { id },
    });

    return { success: true, message: 'Payroll item deleted successfully' };
  }
}
