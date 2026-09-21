import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, PurchaseInvoiceStatus, PaymentStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { CreatePurchaseInvoiceDto, CreatePurchaseInvoiceItemDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { GlService } from '../gl/gl.service';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly glService: GlService,
  ) {}

  private toMoney(value: string | number | Prisma.Decimal): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }

  private recomputeTotals(
    items: CreatePurchaseInvoiceItemDto[],
  ): {
    subtotal: Prisma.Decimal;
    tax: Prisma.Decimal;
    discount: Prisma.Decimal;
    total: Prisma.Decimal;
  } {
    let subtotal = new Prisma.Decimal(0);
    let tax = new Prisma.Decimal(0);
    let discount = new Prisma.Decimal(0);

    for (const item of items) {
      const quantity = this.toMoney(item.quantity);
      const unitCost = this.toMoney(item.unitCost);
      const lineTax = this.toMoney(item.tax ?? 0);
      const lineDiscount = this.toMoney(item.discount ?? 0);

      subtotal = subtotal.plus(quantity.mul(unitCost));
      tax = tax.plus(lineTax);
      discount = discount.plus(lineDiscount);
    }

    const total = subtotal.plus(tax).minus(discount);
    return { subtotal, tax, discount, total };
  }

  private buildLineItems(items: CreatePurchaseInvoiceItemDto[]) {
    return items.map((item, idx) => {
      const quantity = this.toMoney(item.quantity);
      const unitCost = this.toMoney(item.unitCost);
      const tax = this.toMoney(item.tax ?? 0);
      const discount = this.toMoney(item.discount ?? 0);
      const lineTotal = quantity.mul(unitCost).minus(discount).plus(tax);
      return {
        description: item.description,
        quantity,
        unitCost,
        tax,
        discount,
        lineTotal,
        sequence: typeof item.sequence === 'number' ? item.sequence : idx,
      };
    });
  }

  async create(dto: CreatePurchaseInvoiceDto, userTenantId: string, userId?: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, tenantId: userTenantId, isActive: true },
      select: { id: true },
    });

    if (!vendor) {
      throw new ForbiddenException('Vendor does not belong to tenant or is inactive');
    }

    if (dto.purchaseOrderId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: dto.purchaseOrderId, tenantId: userTenantId },
        select: { id: true },
      });

      if (!po) {
        throw new ForbiddenException('Purchase order does not belong to tenant');
      }
    }

    const { subtotal, tax, discount, total } = this.recomputeTotals(dto.items);
    const itemsData = this.buildLineItems(dto.items);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        return tx.purchaseInvoice.create({
          data: {
            invoiceNumber: dto.invoiceNumber,
            vendorId: dto.vendorId,
            purchaseOrderId: dto.purchaseOrderId ?? undefined,
            issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
            dueDate: new Date(dto.dueDate),
            status: PurchaseInvoiceStatus.DRAFT,
            subtotal,
            tax,
            discount,
            total,
            amountPaid: new Prisma.Decimal(0),
            balanceAmount: total,
            notes: dto.notes,
            tenantId: userTenantId,
            items: {
              create: itemsData.map((item) => ({
                ...item,
                tenantId: userTenantId,
              })),
            },
          },
          include: {
            vendor: { select: { id: true, name: true, email: true } },
            purchaseOrder: { select: { id: true, orderNumber: true } },
            items: true,
          },
        });
      });

      await this.activityLogsService.log({
        action: 'CREATE',
        module: 'VENDOR_BILL',
        description: `Vendor bill ${created.invoiceNumber} created with ${dto.items.length} line item(s).`,
        userId,
        tenantId: userTenantId,
      });

      return created;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Invoice number already exists for this tenant');
      }
      throw err;
    }
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    query: any,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.PurchaseInvoiceWhereInput = { tenantId: userTenantId };

    if (search.search) {
      where.OR = [
        { invoiceNumber: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { notes: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { vendor: { name: { contains: search.search, mode: Prisma.QueryMode.insensitive } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.purchaseOrderId) {
      where.purchaseOrderId = query.purchaseOrderId;
    }

    if (query.dateFrom || query.dateTo) {
      where.dueDate = {};
      if (query.dateFrom) {
        where.dueDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.dueDate.lte = new Date(query.dateTo);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchaseInvoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          purchaseOrder: { select: { id: true, orderNumber: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseInvoice.count({ where }),
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
    const bill = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseOrder: { select: { id: true, orderNumber: true } },
        items: true,
        payments: { select: { id: true, amount: true, paymentDate: true, method: true, status: true } },
        allocations: {
          include: { payment: { select: { id: true, amount: true, method: true } } },
        },
      },
    });

    if (!bill) {
      throw new NotFoundException('Vendor bill not found');
    }

    if (bill.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this vendor bill');
    }

    return bill;
  }

  async update(id: string, dto: UpdatePurchaseInvoiceDto, userTenantId: string, userId?: string) {
    const bill = await this.findOne(id, userTenantId);

    if (
      bill.status !== PurchaseInvoiceStatus.DRAFT &&
      bill.status !== PurchaseInvoiceStatus.APPROVED
    ) {
      throw new ConflictException('Cannot edit a finalized or cancelled vendor bill');
    }

    const data: Prisma.PurchaseInvoiceUpdateInput = {};

    if (dto.invoiceNumber !== undefined) {
      data.invoiceNumber = dto.invoiceNumber;
    }

    if (dto.vendorId !== undefined) {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: dto.vendorId, tenantId: userTenantId, isActive: true },
        select: { id: true },
      });
      if (!vendor) {
        throw new ForbiddenException('Vendor does not belong to tenant or is inactive');
      }
      data.vendor = { connect: { id: dto.vendorId } };
    }

    if (dto.purchaseOrderId !== undefined) {
      if (dto.purchaseOrderId) {
        const po = await this.prisma.purchaseOrder.findFirst({
          where: { id: dto.purchaseOrderId, tenantId: userTenantId },
          select: { id: true },
        });
        if (!po) {
          throw new ForbiddenException('Purchase order does not belong to tenant');
        }
        data.purchaseOrder = { connect: { id: dto.purchaseOrderId } };
      } else {
        data.purchaseOrder = { disconnect: true };
      }
    }

    if (dto.dueDate !== undefined) {
      data.dueDate = new Date(dto.dueDate);
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    try {
      const updated = await this.prisma.purchaseInvoice.update({
        where: { id },
        data,
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          purchaseOrder: { select: { id: true, orderNumber: true } },
          items: true,
        },
      });

      await this.activityLogsService.log({
        action: 'UPDATE',
        module: 'VENDOR_BILL',
        description: `Vendor bill ${updated.invoiceNumber} updated.`,
        userId,
        tenantId: userTenantId,
      });

      return updated;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Invoice number already exists for this tenant');
      }
      throw err;
    }
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const bill = await this.findOne(id, userTenantId);

    if (bill.status !== PurchaseInvoiceStatus.DRAFT) {
      throw new ConflictException('Only draft vendor bills can be deleted');
    }

    await this.prisma.purchaseInvoice.delete({ where: { id } });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'VENDOR_BILL',
      description: `Vendor bill ${bill.invoiceNumber} deleted.`,
      userId,
      tenantId: userTenantId,
    });

    return { success: true, message: 'Vendor bill deleted successfully' };
  }

  private readonly validTransitions: Record<PurchaseInvoiceStatus, PurchaseInvoiceStatus[]> =
    {
      [PurchaseInvoiceStatus.DRAFT]: [
        PurchaseInvoiceStatus.APPROVED,
        PurchaseInvoiceStatus.POSTED,
        PurchaseInvoiceStatus.CANCELLED,
      ],
      [PurchaseInvoiceStatus.APPROVED]: [
        PurchaseInvoiceStatus.POSTED,
        PurchaseInvoiceStatus.VOIDED,
        PurchaseInvoiceStatus.CANCELLED,
      ],
      [PurchaseInvoiceStatus.POSTED]: [
        PurchaseInvoiceStatus.VOIDED,
        PurchaseInvoiceStatus.CANCELLED,
      ],
      [PurchaseInvoiceStatus.PARTIALLY_PAID]: [
        PurchaseInvoiceStatus.PAID,
        PurchaseInvoiceStatus.VOIDED,
      ],
      [PurchaseInvoiceStatus.PAID]: [PurchaseInvoiceStatus.VOIDED],
      [PurchaseInvoiceStatus.VOIDED]: [],
      [PurchaseInvoiceStatus.CANCELLED]: [],
    };

  async updateStatus(
    id: string,
    status: PurchaseInvoiceStatus,
    userTenantId: string,
    userId?: string,
  ) {
    const bill = await this.findOne(id, userTenantId);

    const allowed = this.validTransitions[bill.status] ?? [];

    if (!allowed.includes(status)) {
      throw new ConflictException(
        `Invalid transition from ${bill.status} to ${status}`,
      );
    }

    if (status === PurchaseInvoiceStatus.VOIDED) {
      const hasPayments = await this.prisma.payment.count({
        where: {
          purchaseInvoiceId: id,
          status: { not: PaymentStatus.VOIDED },
        },
      });
      if (hasPayments > 0) {
        throw new ConflictException('Cannot void a bill that has payments');
      }
    }

    const updated = await this.prisma.purchaseInvoice.update({
      where: { id },
      data: { status },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        purchaseOrder: { select: { id: true, orderNumber: true } },
        items: true,
      },
    });

    if (status === PurchaseInvoiceStatus.POSTED) {
      const netAmount =
        updated.subtotal ??
        new Prisma.Decimal(updated.total).minus(
          updated.tax ? new Prisma.Decimal(updated.tax) : 0,
        );
      await this.glService.postVendorBill(
        userTenantId,
        id,
        netAmount,
        updated.tax,
        userId,
      );
    }

    if (
      (status === PurchaseInvoiceStatus.VOIDED ||
        status === PurchaseInvoiceStatus.CANCELLED) &&
      bill.status === PurchaseInvoiceStatus.POSTED
    ) {
      const netAmount =
        bill.subtotal ??
        new Prisma.Decimal(bill.total).minus(
          bill.tax ? new Prisma.Decimal(bill.tax) : 0,
        );
      await this.glService.reverseVendorBill(
        userTenantId,
        id,
        netAmount,
        bill.tax,
        userId,
      );
    }

    await this.activityLogsService.log({
      action: 'STATUS_UPDATE',
      module: 'VENDOR_BILL',
      description: `Vendor bill ${updated.invoiceNumber} status changed to ${status}.`,
      userId,
      tenantId: userTenantId,
    });

    return updated;
  }
}
