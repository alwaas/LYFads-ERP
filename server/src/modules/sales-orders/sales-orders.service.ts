import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
} from './dto/create-sales-order.dto';
import { FulfillItemDto } from './dto/fulfill-item.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, SalesOrderStatus, StockMovementType } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(dto: CreateSalesOrderDto, userTenantId: string, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Sales order must have at least one item.');
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        tenantId: userTenantId,
      },
      select: { id: true, tenantId: true },
    });

    if (!client) {
      throw new ForbiddenException('Client does not belong to the current tenant.');
    }

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: item.productId,
          tenantId: userTenantId,
          status: 'ACTIVE',
        },
        select: { id: true, tenantId: true },
      });

      if (!product) {
        throw new ForbiddenException(
          `Product ${item.productId} does not belong to the current tenant or is inactive.`,
        );
      }
    }

    const orderNumber = await this.generateOrderNumber(userTenantId);
    const financials = this.calculateFinancials(dto.items);

    const salesOrder = await this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          orderNumber,
          orderDate: new Date(dto.orderDate),
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          status: SalesOrderStatus.DRAFT,
          subtotal: financials.subtotal,
          taxAmount: financials.taxAmount,
          discountAmount: financials.discountAmount,
          totalAmount: financials.totalAmount,
          notes: dto.notes,
          tenantId: userTenantId,
          clientId: dto.clientId,
          createdById: userId,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: new Prisma.Decimal(item.quantity),
              unit: item.unit || null,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              taxRate: item.taxRate != null ? new Prisma.Decimal(item.taxRate) : null,
              discount: item.discount != null ? new Prisma.Decimal(item.discount) : null,
              lineTotal: new Prisma.Decimal(
                this.calculateLineTotal(item.quantity, item.unitPrice, item.taxRate, item.discount),
              ),
              fulfilledQuantity: new Prisma.Decimal(0),
            })),
          },
        },
        include: {
          client: true,
          items: {
            include: {
              product: true,
            },
          },
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
          approvedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      return so;
    });

    await this.activityLogs.create({
      action: 'CREATE',
      module: 'SALES_ORDERS',
      description: `Sales Order "${salesOrder.orderNumber}" created`,
      userId,
      tenantId: userTenantId,
    });

    return salesOrder;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Prisma.SalesOrderWhereInput = {
      tenantId: userTenantId,
      ...(search.search && {
        OR: [
          { orderNumber: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          { notes: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          { client: { companyName: { contains: search.search, mode: Prisma.QueryMode.insensitive } } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, companyName: true, contactPerson: true },
          },
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
          approvedBy: {
            select: { id: true, fullName: true, email: true },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.salesOrder.count({ where }),
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
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
      include: {
        client: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unit: true },
            },
          },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        approvedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!salesOrder) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    return salesOrder;
  }

  async update(id: string, dto: UpdateSalesOrderDto, userTenantId: string, userId?: string) {
    const existingSo = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
      select: { id: true, status: true, clientId: true },
    });

    if (!existingSo) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    if (existingSo.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft sales orders can be edited.');
    }

    if (dto.clientId && dto.clientId !== existingSo.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, tenantId: userTenantId },
        select: { id: true },
      });

      if (!client) {
        throw new ForbiddenException('Client does not belong to the current tenant.');
      }
    }

    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        const product = await this.prisma.product.findFirst({
          where: {
            id: item.productId,
            tenantId: userTenantId,
            status: 'ACTIVE',
          },
          select: { id: true, tenantId: true },
        });

        if (!product) {
          throw new ForbiddenException(
            `Product ${item.productId} does not belong to the current tenant or is inactive.`,
          );
        }
      }
    }

    const financials = dto.items && dto.items.length > 0
      ? this.calculateFinancials(dto.items)
      : null;

    const updatedSo = await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.SalesOrderUncheckedUpdateInput = {
        orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
        notes: dto.notes,
        clientId: dto.clientId,
        ...(financials && {
          subtotal: financials.subtotal,
          taxAmount: financials.taxAmount,
          discountAmount: financials.discountAmount,
          totalAmount: financials.totalAmount,
        }),
      };

      const so = await tx.salesOrder.update({
        where: { id },
        data: updateData,
      });

      if (dto.items && dto.items.length > 0) {
        await tx.salesOrderItem.deleteMany({
          where: { salesOrderId: id },
        });

        await tx.salesOrderItem.createMany({
          data: dto.items.map((item) => ({
            salesOrderId: id,
            productId: item.productId,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
            unit: item.unit || null,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            taxRate: item.taxRate != null ? new Prisma.Decimal(item.taxRate) : null,
            discount: item.discount != null ? new Prisma.Decimal(item.discount) : null,
            lineTotal: new Prisma.Decimal(
              this.calculateLineTotal(item.quantity, item.unitPrice, item.taxRate, item.discount),
            ),
            fulfilledQuantity: new Prisma.Decimal(0),
          })),
        });
      }

      return tx.salesOrder.findUnique({
        where: { id },
        include: {
          client: true,
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true, unit: true },
              },
            },
          },
          createdBy: { select: { id: true, fullName: true, email: true } },
          approvedBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    });

    if (!updatedSo) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'SALES_ORDERS',
      description: `Sales Order "${updatedSo.orderNumber}" updated`,
      userId,
      tenantId: userTenantId,
    });

    return updatedSo;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!so) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    if (so.status !== SalesOrderStatus.DRAFT && so.status !== SalesOrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Only draft or cancelled sales orders can be deleted.',
      );
    }

    await this.prisma.salesOrder.delete({ where: { id: so.id } });

    await this.activityLogs.create({
      action: 'DELETE',
      module: 'SALES_ORDERS',
      description: `Sales Order "${so.orderNumber}" deleted`,
      userId,
      tenantId: userTenantId,
    });

    return { message: 'Sales order deleted successfully.', id: so.id };
  }

  async submit(id: string, userTenantId: string, userId?: string) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
      include: { items: true },
    });

    if (!so) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    if (so.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft sales orders can be submitted.');
    }

    if (!so.items || so.items.length === 0) {
      throw new BadRequestException('Sales order must have at least one item.');
    }

    const updatedSo = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.SUBMITTED },
      include: {
        client: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unit: true },
            },
          },
        },
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'SUBMIT',
      module: 'SALES_ORDERS',
      description: `Sales Order "${updatedSo.orderNumber}" submitted for approval`,
      userId,
      tenantId: userTenantId,
    });

    return updatedSo;
  }

  async approve(id: string, userTenantId: string, userId?: string) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!so) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    if (so.status !== SalesOrderStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted sales orders can be approved.');
    }

    const updatedSo = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: SalesOrderStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        client: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unit: true },
            },
          },
        },
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'APPROVE',
      module: 'SALES_ORDERS',
      description: `Sales Order "${updatedSo.orderNumber}" approved`,
      userId,
      tenantId: userTenantId,
    });

    return updatedSo;
  }

  async reject(id: string, userTenantId: string, userId?: string) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!so) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    if (so.status !== SalesOrderStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted sales orders can be rejected.');
    }

    const updatedSo = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.REJECTED },
      include: {
        client: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unit: true },
            },
          },
        },
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'REJECT',
      module: 'SALES_ORDERS',
      description: `Sales Order "${updatedSo.orderNumber}" rejected`,
      userId,
      tenantId: userTenantId,
    });

    return updatedSo;
  }

  async cancel(id: string, userTenantId: string, userId?: string) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!so) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    if (
      so.status !== SalesOrderStatus.DRAFT &&
      so.status !== SalesOrderStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        'Only draft or submitted sales orders can be cancelled.',
      );
    }

    const updatedSo = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.CANCELLED },
      include: {
        client: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unit: true },
            },
          },
        },
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'CANCEL',
      module: 'SALES_ORDERS',
      description: `Sales Order "${updatedSo.orderNumber}" cancelled`,
      userId,
      tenantId: userTenantId,
    });

    return updatedSo;
  }

  async fulfill(id: string, dto: FulfillItemDto[], userTenantId: string, userId?: string) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId: userTenantId },
      include: { items: true },
    });

    if (!so) {
      throw new ForbiddenException('Access denied to this sales order.');
    }

    if (
      so.status !== SalesOrderStatus.APPROVED &&
      so.status !== SalesOrderStatus.PARTIALLY_FULFILLED
    ) {
      throw new BadRequestException(
        'Only approved or partially fulfilled sales orders can be fulfilled.',
      );
    }

    const itemMap = new Map(so.items.map((item) => [item.id, item]));

    const fulfillmentPlan: Array<{
      itemId: string;
      productId: string;
      delta: number;
    }> = [];

    for (const req of dto) {
      const item = itemMap.get(req.itemId);
      if (!item) {
        throw new NotFoundException(`Item ${req.itemId} not found.`);
      }

      const currentFulfilled = Number(item.fulfilledQuantity || 0);
      const requestedTotal = req.fulfillQuantity;
      const delta = requestedTotal - currentFulfilled;

      if (delta <= 0) {
        continue;
      }

      const remaining = Number(item.quantity) - currentFulfilled;
      if (delta > remaining) {
        throw new BadRequestException(
          `Cannot fulfill ${delta} for item ${item.description}. Only ${remaining} remaining.`,
        );
      }

      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, tenantId: userTenantId },
        select: { id: true, tenantId: true },
      });

      if (!product) {
        throw new ForbiddenException(
          `Product ${item.productId} does not belong to the current tenant.`,
        );
      }

      fulfillmentPlan.push({
        itemId: item.id,
        productId: item.productId,
        delta,
      });
    }

    const updatedSo = await this.prisma.$transaction(async (tx) => {
      let allFulfilled = true;
      let anyFulfilled = false;

      for (const plan of fulfillmentPlan) {
        const item = await tx.salesOrderItem.findFirst({
          where: { id: plan.itemId, salesOrderId: id },
        });

        if (!item) {
          throw new NotFoundException(`Item ${plan.itemId} not found.`);
        }

        const currentQty = Number(item.fulfilledQuantity || 0);
        const newFulfilled = currentQty + plan.delta;

        await tx.salesOrderItem.update({
          where: { id: item.id },
          data: { fulfilledQuantity: new Prisma.Decimal(newFulfilled) },
        });

        let inventory = await tx.inventory.findFirst({
          where: { productId: plan.productId, tenantId: userTenantId },
        });

        if (!inventory) {
          throw new BadRequestException(
            `Insufficient inventory for product ${plan.productId}.`,
          );
        }

        const currentInventoryQty = Number(inventory.quantity);
        const newInventoryQty = currentInventoryQty - plan.delta;

        if (newInventoryQty < 0) {
          throw new BadRequestException(
            `Insufficient inventory for product ${plan.productId}.`,
          );
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: new Prisma.Decimal(newInventoryQty) },
        });

        await tx.stockMovement.create({
          data: {
            productId: plan.productId,
            tenantId: userTenantId,
            type: StockMovementType.SALE,
            quantity: new Prisma.Decimal(plan.delta),
            referenceType: 'SALES_ORDER',
            referenceId: id,
            note: `Fulfilled from SO ${so.orderNumber}`,
            createdById: userId,
          },
        });

        if (newFulfilled > 0) {
          anyFulfilled = true;
        }

        const itemQty = Number(item.quantity);
        if (newFulfilled < itemQty) {
          allFulfilled = false;
        }
      }

      let newStatus = so.status;
      if (allFulfilled && fulfillmentPlan.length > 0) {
        newStatus = SalesOrderStatus.FULFILLED;
      } else if (anyFulfilled) {
        newStatus = SalesOrderStatus.PARTIALLY_FULFILLED;
      }

      return tx.salesOrder.update({
        where: { id },
        data: { status: newStatus },
        include: {
          client: true,
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true, unit: true },
              },
            },
          },
          createdBy: { select: { id: true, fullName: true, email: true } },
          approvedBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    });

    await this.activityLogs.create({
      action: 'FULFILL',
      module: 'SALES_ORDERS',
      description: `Sales Order "${updatedSo.orderNumber}" fulfilled`,
      userId,
      tenantId: userTenantId,
    });

    return updatedSo;
  }

  private calculateLineTotal(
    quantity: number,
    unitPrice: number,
    taxRate?: number,
    discount?: number,
  ): number {
    const subtotal = quantity * unitPrice;
    const discountAmount = discount != null ? discount : 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxRate != null ? taxableAmount * (taxRate / 100) : 0;
    return taxableAmount + taxAmount;
  }

  private calculateFinancials(items: CreateSalesOrderDto['items']): {
    subtotal: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
  } {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    for (const item of items) {
      const lineSubtotal = item.quantity * item.unitPrice;
      subtotal += lineSubtotal;

      const itemDiscount = item.discount != null ? item.discount : 0;
      discountAmount += itemDiscount;

      const taxableAmount = lineSubtotal - itemDiscount;
      const itemTaxRate = item.taxRate != null ? item.taxRate : 0;
      taxAmount += taxableAmount * (itemTaxRate / 100);
    }

    return {
      subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
      taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
      discountAmount: new Prisma.Decimal(discountAmount.toFixed(2)),
      totalAmount: new Prisma.Decimal((subtotal - discountAmount + taxAmount).toFixed(2)),
    };
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SO-${year}-`;

    const lastSo = await this.prisma.salesOrder.findFirst({
      where: {
        AND: [
          { orderNumber: { startsWith: prefix } },
          { tenantId },
        ],
      },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let nextNumber = 1;
    if (lastSo) {
      const parts = lastSo.orderNumber.split('-');
      const lastNumber = parseInt(parts[parts.length - 1] || '0', 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }
}
