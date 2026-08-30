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
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/create-purchase-order.dto';
import { ReceiveItemDto } from './dto/receive-item.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(dto: CreatePurchaseOrderDto, userTenantId: string, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase order must have at least one item.');
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: dto.vendorId,
        tenantId: userTenantId,
      },
      select: { id: true, tenantId: true },
    });

    if (!vendor) {
      throw new ForbiddenException('Vendor does not belong to the current tenant.');
    }

    const poNumber = await this.generatePoNumber(userTenantId);

    const financials = this.calculateFinancials(dto.items);

    const purchaseOrder = await this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          title: dto.title,
          description: dto.description,
          orderDate: new Date(dto.orderDate),
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          status: PurchaseOrderStatus.DRAFT,
          subtotal: financials.subtotal,
          taxAmount: financials.taxAmount,
          discountAmount: financials.discountAmount,
          totalAmount: financials.totalAmount,
          notes: dto.notes,
          tenantId: userTenantId,
          vendorId: dto.vendorId,
          createdById: userId,
          items: {
            create: dto.items.map((item) => ({
              description: item.description,
              quantity: new Prisma.Decimal(item.quantity),
              unit: item.unit || null,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              taxRate: item.taxRate != null ? new Prisma.Decimal(item.taxRate) : null,
              discount: item.discount != null ? new Prisma.Decimal(item.discount) : null,
              lineTotal: new Prisma.Decimal(
                this.calculateLineTotal(item.quantity, item.unitPrice, item.taxRate, item.discount),
              ),
              receivedQuantity: new Prisma.Decimal(0),
            })),
          },
        },
        include: {
          vendor: true,
          items: true,
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      return po;
    });

    await this.activityLogs.create({
      action: 'CREATE',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${purchaseOrder.poNumber}" created`,
      userId,
      tenantId: userTenantId,
    });

    return purchaseOrder;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId: userTenantId,
      ...(search.search && {
        OR: [
          { poNumber: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          { title: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: {
            select: { id: true, name: true, vendorCode: true },
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
      this.prisma.purchaseOrder.count({ where }),
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
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
      include: {
        vendor: true,
        items: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        approvedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!purchaseOrder) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    return purchaseOrder;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto, userTenantId: string, userId?: string) {
    const existingPo = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
      select: { id: true, status: true, vendorId: true },
    });

    if (!existingPo) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    if (existingPo.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft purchase orders can be edited.');
    }

    if (dto.vendorId && dto.vendorId !== existingPo.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: dto.vendorId, tenantId: userTenantId },
        select: { id: true },
      });

      if (!vendor) {
        throw new ForbiddenException('Vendor does not belong to the current tenant.');
      }
    }

    const financials = dto.items && dto.items.length > 0
      ? this.calculateFinancials(dto.items)
      : null;

    const updatedPo = await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.PurchaseOrderUncheckedUpdateInput = {
        title: dto.title,
        description: dto.description,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
        notes: dto.notes,
        vendorId: dto.vendorId,
        ...(financials && {
          subtotal: financials.subtotal,
          taxAmount: financials.taxAmount,
          discountAmount: financials.discountAmount,
          totalAmount: financials.totalAmount,
        }),
      };

      const po = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          vendor: true,
          items: true,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        await tx.purchaseOrderItem.createMany({
          data: dto.items.map((item) => ({
            purchaseOrderId: id,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
            unit: item.unit || null,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            taxRate: item.taxRate != null ? new Prisma.Decimal(item.taxRate) : null,
            discount: item.discount != null ? new Prisma.Decimal(item.discount) : null,
            lineTotal: new Prisma.Decimal(
              this.calculateLineTotal(item.quantity, item.unitPrice, item.taxRate, item.discount),
            ),
            receivedQuantity: new Prisma.Decimal(0),
          })),
        });
      }

      return tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          vendor: true,
          items: true,
          createdBy: { select: { id: true, fullName: true, email: true } },
          approvedBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    });

    if (!updatedPo) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${updatedPo.poNumber}" updated`,
      userId,
      tenantId: userTenantId,
    });

    return updatedPo;
  }

  async submit(id: string, userTenantId: string, userId?: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
      include: { items: true },
    });

    if (!po) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft purchase orders can be submitted.');
    }

    if (!po.items || po.items.length === 0) {
      throw new BadRequestException('Purchase order must have at least one item.');
    }

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.SUBMITTED },
      include: {
        vendor: true,
        items: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'SUBMIT',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${updatedPo.poNumber}" submitted for approval`,
      userId,
      tenantId: userTenantId,
    });

    return updatedPo;
  }

  async approve(id: string, userTenantId: string, userId?: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!po) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    if (po.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted purchase orders can be approved.');
    }

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        vendor: true,
        items: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'APPROVE',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${updatedPo.poNumber}" approved`,
      userId,
      tenantId: userTenantId,
    });

    return updatedPo;
  }

  async reject(id: string, userTenantId: string, userId?: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!po) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    if (po.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted purchase orders can be rejected.');
    }

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.REJECTED },
      include: {
        vendor: true,
        items: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'REJECT',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${updatedPo.poNumber}" rejected`,
      userId,
      tenantId: userTenantId,
    });

    return updatedPo;
  }

  async cancel(id: string, userTenantId: string, userId?: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!po) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    if (
      po.status !== PurchaseOrderStatus.DRAFT &&
      po.status !== PurchaseOrderStatus.SUBMITTED
    ) {
      throw new BadRequestException('Only draft or submitted purchase orders can be cancelled.');
    }

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: {
        vendor: true,
        items: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.activityLogs.create({
      action: 'CANCEL',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${updatedPo.poNumber}" cancelled`,
      userId,
      tenantId: userTenantId,
    });

    return updatedPo;
  }

  async receive(
    id: string,
    dto: ReceiveItemDto[],
    userTenantId: string,
    userId?: string,
  ) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
      include: { items: true },
    });

    if (!po) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    if (
      po.status !== PurchaseOrderStatus.APPROVED &&
      po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        'Only approved or partially received purchase orders can be received.',
      );
    }

    const updatedPo = await this.prisma.$transaction(async (tx) => {
      for (const receive of dto) {
        const item = await tx.purchaseOrderItem.findFirst({
          where: { id: receive.itemId, purchaseOrderId: id },
        });

        if (!item) {
          throw new NotFoundException(`Item ${receive.itemId} not found.`);
        }

        const currentReceived = Number(item.receivedQuantity || 0);
        const newReceived = currentReceived + receive.receivedQuantity;
        const orderedQty = Number(item.quantity);

        if (newReceived > orderedQty) {
          throw new BadRequestException(
            `Received quantity cannot exceed ordered quantity for item ${item.description}.`,
          );
        }

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: new Prisma.Decimal(newReceived) },
        });

        if (item.productId) {
          const product = await tx.product.findFirst({
            where: { id: item.productId },
            select: { id: true, tenantId: true },
          });

          if (product && product.tenantId === userTenantId) {
            let inventory = await tx.inventory.findFirst({
              where: { productId: item.productId, tenantId: userTenantId },
            });

            if (!inventory) {
              inventory = await tx.inventory.create({
                data: {
                  productId: item.productId,
                  tenantId: userTenantId,
                  quantity: new Prisma.Decimal(0),
                  reservedQuantity: new Prisma.Decimal(0),
                },
              });
            }

            const currentQty = Number(inventory.quantity);
            const newQty = currentQty + receive.receivedQuantity;

            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: new Prisma.Decimal(newQty) },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                tenantId: userTenantId,
                type: StockMovementType.PURCHASE_RECEIPT,
                quantity: new Prisma.Decimal(receive.receivedQuantity),
                referenceType: 'PURCHASE_ORDER',
                referenceId: id,
                note: `Received from PO ${po.poNumber}`,
                createdById: userId,
              },
            });
          }
        }
      }

      const allItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allReceived = allItems.every(
        (item) => Number(item.receivedQuantity || 0) >= Number(item.quantity),
      );

      const anyReceived = allItems.some(
        (item) => Number(item.receivedQuantity || 0) > 0,
      );

      let newStatus = po.status;
      if (allReceived) {
        newStatus = PurchaseOrderStatus.RECEIVED;
      } else if (anyReceived) {
        newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
        include: {
          vendor: true,
          items: true,
          createdBy: { select: { id: true, fullName: true, email: true } },
          approvedBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    });

    await this.activityLogs.create({
      action: 'RECEIVE',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${updatedPo.poNumber}" received`,
      userId,
      tenantId: userTenantId,
    });

    return updatedPo;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: userTenantId },
      select: { id: true, poNumber: true, status: true },
    });

    if (!po) {
      throw new ForbiddenException('Access denied to this purchase order.');
    }

    if (
      po.status !== PurchaseOrderStatus.DRAFT &&
      po.status !== PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Only draft or cancelled purchase orders can be deleted.',
      );
    }

    await this.prisma.purchaseOrder.delete({ where: { id: po.id } });

    await this.activityLogs.create({
      action: 'DELETE',
      module: 'PURCHASE_ORDERS',
      description: `Purchase Order "${po.poNumber}" deleted`,
      userId,
      tenantId: userTenantId,
    });

    return { message: 'Purchase order deleted successfully.', id: po.id };
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

  private calculateFinancials(items: CreatePurchaseOrderDto['items']): {
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

  private async generatePoNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const lastPo = await this.prisma.purchaseOrder.findFirst({
      where: {
        AND: [
          { poNumber: { startsWith: prefix } },
          { tenantId },
        ],
      },
      orderBy: { poNumber: 'desc' },
      select: { poNumber: true },
    });

    let nextNumber = 1;
    if (lastPo) {
      const parts = lastPo.poNumber.split('-');
      const lastNumber = parseInt(parts[parts.length - 1] || '0', 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }
}
