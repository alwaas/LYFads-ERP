import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateInvoiceFromSalesOrderDto } from './dto/create-invoice-from-sales-order.dto';
import { Prisma, InvoiceStatus, SalesOrderStatus } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: {
        invoiceNumber: true,
      },
    });

    let nextSeq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0', 10);
      nextSeq = lastSeq + 1;
    }

    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }

  async create(dto: CreateInvoiceDto, userTenantId: string, userId?: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId: userTenantId },
      select: { id: true, companyName: true },
    });

    if (!client) {
      throw new ForbiddenException('Client does not belong to the current tenant.');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, tenantId: userTenantId },
        select: { id: true },
      });

      if (!project) {
        throw new ForbiddenException('Project does not belong to the current tenant.');
      }
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item.');
    }

    const invoiceNumber = await this.generateInvoiceNumber(userTenantId);

    const subtotal = this.calculateSubtotal(dto.items);
    const taxAmount = this.calculateTax(dto.items);
    const discountAmount = this.calculateDiscount(dto.items);
    const total = this.calculateTotal(subtotal, taxAmount, discountAmount);

    const invoice = await this.prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: dto.clientId,
          projectId: dto.projectId,
          tenantId: userTenantId,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          status: dto.status || InvoiceStatus.DRAFT,
          subtotal: new Prisma.Decimal(subtotal),
          tax: new Prisma.Decimal(taxAmount),
          discount: new Prisma.Decimal(discountAmount),
          total: new Prisma.Decimal(total),
          paidAmount: new Prisma.Decimal(0),
          balanceAmount: new Prisma.Decimal(total),
          notes: dto.notes,
          createdById: userId,
        },
      });

      for (const item of dto.items) {
        const lineTotal = this.calculateLineTotal(item);
        await tx.invoiceItem.create({
          data: {
            invoiceId: createdInvoice.id,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            taxRate: item.taxRate ? new Prisma.Decimal(item.taxRate) : undefined,
            taxAmount: item.taxAmount ? new Prisma.Decimal(item.taxAmount) : undefined,
            discount: item.discount ? new Prisma.Decimal(item.discount) : undefined,
            lineTotal: new Prisma.Decimal(lineTotal),
            tenantId: userTenantId,
          },
        });
      }

      return createdInvoice;
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'INVOICE',
      description: `Invoice ${invoice.invoiceNumber} created for client ${client.companyName}.`,
      userId,
      tenantId: userTenantId,
    });

    return this.findOne(invoice.id, userTenantId);
  }

  async createFromSalesOrder(
    salesOrderId: string,
    dto: CreateInvoiceFromSalesOrderDto,
    userTenantId: string,
    userId?: string,
  ) {
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId, tenantId: userTenantId },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales Order not found');
    }

    if (salesOrder.status === SalesOrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot invoice a cancelled Sales Order.');
    }

    const invoiceNumber = await this.generateInvoiceNumber(userTenantId);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: salesOrder.clientId,
          salesOrderId: salesOrder.id,
          tenantId: userTenantId,
          issueDate: new Date(dto.issueDate || new Date()),
          dueDate,
          status: InvoiceStatus.DRAFT,
          subtotal: new Prisma.Decimal(0),
          tax: new Prisma.Decimal(0),
          discount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),
          paidAmount: new Prisma.Decimal(0),
          balanceAmount: new Prisma.Decimal(0),
          notes: dto.notes,
          createdById: userId,
        },
      });

      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;
      let total = 0;

      for (const soItem of salesOrder.items) {
        const fulfilledQty = Number(soItem.fulfilledQuantity || 0);
        const alreadyInvoiced = await this.getInvoicedQuantity(soItem.id, tx);

        const remainingQty = Math.max(0, fulfilledQty - alreadyInvoiced);

        if (remainingQty <= 0) {
          continue;
        }

        const invoiceQty = Math.min(remainingQty, Number(soItem.quantity));
        const unitPrice = Number(soItem.unitPrice);
        const lineTotal = invoiceQty * unitPrice;
        const itemTax = soItem.taxRate
          ? lineTotal * Number(soItem.taxRate) / 100
          : 0;
        const itemDiscount = soItem.discount
          ? Number(soItem.discount)
          : 0;
        const itemLineTotal = lineTotal + itemTax - itemDiscount;

        await tx.invoiceItem.create({
          data: {
            invoiceId: createdInvoice.id,
            salesOrderItemId: soItem.id,
            productId: soItem.productId,
            description: soItem.description,
            quantity: new Prisma.Decimal(invoiceQty),
            unitPrice: new Prisma.Decimal(unitPrice),
            taxRate: soItem.taxRate,
            taxAmount: new Prisma.Decimal(itemTax),
            discount: soItem.discount ? new Prisma.Decimal(itemDiscount) : undefined,
            lineTotal: new Prisma.Decimal(itemLineTotal),
            tenantId: userTenantId,
          },
        });

        subtotal += lineTotal;
        taxAmount += itemTax;
        discountAmount += itemDiscount;
        total += itemLineTotal;
      }

      if (total === 0) {
        throw new BadRequestException(
          'No eligible fulfilled quantity available to invoice.',
        );
      }

      await tx.invoice.update({
        where: { id: createdInvoice.id },
        data: {
          subtotal: new Prisma.Decimal(subtotal),
          tax: new Prisma.Decimal(taxAmount),
          discount: new Prisma.Decimal(discountAmount),
          total: new Prisma.Decimal(total),
          balanceAmount: new Prisma.Decimal(total),
        },
      });

      return tx.invoice.findUnique({
        where: { id: createdInvoice.id },
        include: {
          client: true,
          project: true,
          salesOrder: true,
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
      });
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'INVOICE',
      description: `Invoice ${invoice!.invoiceNumber} generated from Sales Order ${salesOrder.orderNumber}.`,
      userId,
      tenantId: userTenantId,
    });

    return invoice;
  }

  async issue(id: string, userTenantId: string, userId?: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot issue invoice with status ${invoice.status}. Only DRAFT invoices can be issued.`,
      );
    }

    try {
      const updated = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
        },
      });

      await this.activityLogsService.log({
        action: 'ISSUE',
        module: 'INVOICE',
        description: `Invoice ${updated.invoiceNumber} issued.`,
        userId,
        tenantId: userTenantId,
      });

      return updated;
    } catch (err) {
      console.error('ISSUE ERROR:', err);
      throw err;
    }
  }

  async voidInvoice(id: string, userTenantId: string, userId?: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!this.canVoid(invoice.status)) {
      throw new BadRequestException(
        `Cannot void invoice with status ${invoice.status}.`,
      );
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.VOID,
      },
    });

    await this.activityLogsService.log({
      action: 'VOID',
      module: 'INVOICE',
      description: `Invoice ${updated.invoiceNumber} voided.`,
      userId,
      tenantId: userTenantId,
    });

    return updated;
  }

  async getARSummary(userTenantId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: userTenantId,
        status: {
          notIn: [InvoiceStatus.VOID, InvoiceStatus.DRAFT],
        },
      },
      select: {
        total: true,
        paidAmount: true,
        balanceAmount: true,
        dueDate: true,
        status: true,
        createdAt: true,
      },
    });

    const now = new Date();
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let currentReceivables = 0;
    let partiallyPaid = 0;
    let totalPaid = 0;

    const aging: Record<string, number> = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    for (const invoice of invoices) {
      const balance = Number(invoice.balanceAmount);
      totalOutstanding += balance;

      if (invoice.status === InvoiceStatus.PARTIALLY_PAID) {
        partiallyPaid += 1;
      }

      if (invoice.status === InvoiceStatus.PAID) {
        totalPaid += Number(invoice.total);
      }

      // Only calculate aging for invoices with outstanding balance
      if (balance > 0) {
        const daysPastDue = this.getDaysPastDue(invoice.dueDate, now);
        if (daysPastDue > 0) {
          totalOverdue += balance;
          if (daysPastDue <= 30) aging['0-30'] += balance;
          else if (daysPastDue <= 60) aging['31-60'] += balance;
          else if (daysPastDue <= 90) aging['61-90'] += balance;
          else aging['90+'] += balance;
        } else {
          currentReceivables += balance;
        }
      }
    }

    return {
      totalOutstanding,
      totalOverdue,
      currentReceivables,
      partiallyPaid,
      totalPaid,
      invoiceCount: invoices.length,
      overdueInvoiceCount: invoices.filter(
        (inv) => this.getDaysPastDue(inv.dueDate, now) > 0 && Number(inv.balanceAmount) > 0,
      ).length,
      aging,
    };
  }

  async getCustomerLedger(clientId: string, userTenantId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, tenantId: true },
    });

    if (!client || client.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this client');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: userTenantId,
        clientId,
        status: {
          notIn: [InvoiceStatus.VOID, InvoiceStatus.DRAFT],
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        dueDate: true,
        total: true,
        paidAmount: true,
        balanceAmount: true,
        status: true,
        createdAt: true,
        allocations: {
          include: {
            payment: {
              select: {
                id: true,
                paymentDate: true,
                method: true,
                referenceNo: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { issueDate: 'asc' },
    });

    return invoices.map((invoice) => {
      const balance = Number(invoice.balanceAmount);
      const paid = Number(invoice.paidAmount);
      const total = Number(invoice.total);
      const daysPastDue = this.getDaysPastDue(invoice.dueDate, new Date());

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        total,
        paidAmount: paid,
        balanceAmount: balance,
        status: invoice.status,
        daysPastDue,
        aging: balance > 0 && daysPastDue > 0 ? (daysPastDue <= 30 ? '0-30' : daysPastDue <= 60 ? '31-60' : daysPastDue <= 90 ? '61-90' : '90+') : null,
        payments: invoice.allocations.map((allocation) => ({
          id: allocation.payment.id,
          paymentDate: allocation.payment.paymentDate,
          method: allocation.payment.method,
          referenceNo: allocation.payment.referenceNo,
          status: allocation.payment.status,
          amount: Number(allocation.amount),
        })),
      };
    });
  }

  findAll(userTenantId: string, searchQuery?: string, status?: string) {
    const where: Prisma.InvoiceWhereInput = {
      tenantId: userTenantId,
    };

    if (searchQuery) {
      where.OR = [
        { invoiceNumber: { contains: searchQuery } },
        { client: { companyName: { contains: searchQuery } } },
      ];
    }

    if (status) {
      where.status = status as InvoiceStatus;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        project: true,
        salesOrder: true,
        items: true,
        allocations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userTenantId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        salesOrder: true,
        items: {
          include: {
            product: true,
          },
        },
        allocations: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                method: true,
                referenceNo: true,
                status: true,
              },
            },
          },
        },
        createdBy: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    return invoice;
  }

  async update(
    id: string,
    dto: UpdateInvoiceDto,
    userTenantId: string,
    userId?: string,
  ) {
    const invoice = await this.findOne(id, userTenantId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot update issued invoice. Use VOID for cancellations.',
      );
    }

    const data: Prisma.InvoiceUpdateInput = {};

    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, tenantId: userTenantId },
        select: { id: true },
      });

      if (!client) {
        throw new ForbiddenException('Client does not belong to the current tenant.');
      }

      data.client = { connect: { id: dto.clientId } };
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, tenantId: userTenantId },
        select: { id: true },
      });

      if (!project) {
        throw new ForbiddenException('Project does not belong to the current tenant.');
      }

      data.project = { connect: { id: dto.projectId } };
    }

    if (dto.issueDate) data.issueDate = new Date(dto.issueDate);
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.status) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data,
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'INVOICE',
      description: `Invoice ${updatedInvoice.invoiceNumber} updated.`,
      userId,
      tenantId: userTenantId,
    });

    return updatedInvoice;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const invoice = await this.findOne(id, userTenantId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT invoices can be deleted. Use VOID for issued invoices.',
      );
    }

    await this.prisma.invoice.delete({ where: { id } });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'INVOICE',
      description: `Invoice ${invoice.invoiceNumber} deleted.`,
      userId,
      tenantId: userTenantId,
    });

    return { success: true, message: 'Invoice deleted successfully' };
  }

  private async getInvoicedQuantity(
    salesOrderItemId: string,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const items = await tx.invoiceItem.findMany({
      where: { salesOrderItemId },
      select: { quantity: true },
    });

    return items.reduce((sum, item) => sum + Number(item.quantity), 0);
  }

  private calculateSubtotal(items: any[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  private calculateTax(items: any[]): number {
    return items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const discount = Number(item.discount || 0);
      const taxable = lineTotal - discount;
      const taxRate = Number(item.taxRate || 0);
      return sum + taxable * taxRate / 100;
    }, 0);
  }

  private calculateDiscount(items: any[]): number {
    return items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  }

  private calculateTotal(
    subtotal: number,
    tax: number,
    discount: number,
  ): number {
    return subtotal + tax - discount;
  }

  private calculateLineTotal(item: any): number {
    const lineTotal = item.quantity * item.unitPrice;
    const discount = Number(item.discount || 0);
    const taxable = lineTotal - discount;
    const taxRate = Number(item.taxRate || 0);
    return taxable + taxable * taxRate / 100;
  }

  private canVoid(status: InvoiceStatus): boolean {
    const allowed: InvoiceStatus[] = [
      InvoiceStatus.DRAFT,
      InvoiceStatus.ISSUED,
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.OVERDUE,
    ];
    return allowed.includes(status);
  }

  private getDaysPastDue(dueDate: Date, now: Date): number {
    const diff = now.getTime() - new Date(dueDate).getTime();
    return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
  }
}
