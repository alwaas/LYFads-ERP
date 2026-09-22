import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, InvoiceStatus, PurchaseInvoiceStatus } from '@prisma/client';
import type {
  DashboardQueryDto,
  ExpenseQueryDto,
  ProfitabilityQueryDto,
  PurchaseQueryDto,
  ReceivablesQueryDto,
  PayablesQueryDto,
  SalesQueryDto,
  VendorQueryDto,
  CustomerQueryDto,
  InventoryQueryDto,
} from './dto/report-query.dto';
import { InventoryValuationService } from '../inventory-valuation/inventory-valuation.service';
import { GlService } from '../gl/gl.service';

type DateRange = {
  dateFrom?: Date;
  dateTo?: Date;
};

function buildDateRange(query: { dateFrom?: string; dateTo?: string }): DateRange {
  const range: DateRange = {};
  if (query.dateFrom) range.dateFrom = new Date(query.dateFrom);
  if (query.dateTo) range.dateTo = new Date(query.dateTo);
  return range;
}

function buildInvoiceWhere(
  tenantId: string,
  range: DateRange,
  status?: InvoiceStatus,
  clientId?: string,
  projectId?: string,
) {
  const where: any = { tenantId };
  if (range.dateFrom || range.dateTo) {
    where.issueDate = {};
    if (range.dateFrom) where.issueDate.gte = range.dateFrom;
    if (range.dateTo) where.issueDate.lte = range.dateTo;
  }
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (projectId) where.projectId = projectId;
  return where;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof (value as any).toNumber === 'function') return (value as any).toNumber();
  return 0;
}

function countId(obj: any): number {
  return obj && typeof obj === 'object' && 'id' in obj ? obj.id : 0;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly valuation: InventoryValuationService,
    private readonly glService: GlService,
  ) {}

  async getDashboard(tenantId: string, query: DashboardQueryDto) {
    const range = buildDateRange(query);

    const paymentDateFilter: Prisma.DateTimeFilter = {};
    if (range.dateFrom) paymentDateFilter.gte = range.dateFrom;
    if (range.dateTo) paymentDateFilter.lte = range.dateTo;

    const [
      totalSales,
      totalPayments,
      outstandingReceivables,
      overdueReceivables,
      invoiceCount,
      customerCount,
      vendorCount,
      orderCount,
      productCount,
      lowStockCountResult,
      lowStockItemsResult,
      valuationInfo,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: buildInvoiceWhere(tenantId, range),
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, paymentDate: paymentDateFilter, status: 'ACTIVE' as any },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...buildInvoiceWhere(tenantId, range),
          balanceAmount: { gt: 0 },
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...buildInvoiceWhere(tenantId, range),
          status: 'OVERDUE' as InvoiceStatus,
          balanceAmount: { gt: 0 },
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.invoice.count({
        where: buildInvoiceWhere(tenantId, range),
      }),
      this.prisma.client.count({ where: { tenantId, isActive: true } }),
      this.prisma.tenant.count({ where: { id: tenantId } }),
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM products
        WHERE "tenantId" = ${tenantId} AND "isActive" = true AND "stockQuantity" <= "minStockLevel"
      `,
      this.prisma.$queryRaw<Array<{ id: string; sku: string; name: string; stockQuantity: number; minStockLevel: number }>>`
        SELECT id, sku, name, "stockQuantity", "minStockLevel"
        FROM products
        WHERE "tenantId" = ${tenantId} AND "isActive" = true AND "stockQuantity" <= "minStockLevel"
        ORDER BY "stockQuantity" ASC
        LIMIT 10
      `,
      this.valuation.computeInventoryValue(tenantId),
    ]);

    const cashIn = toNumber(totalPayments._sum!.amount);
    const cashOut = 0;

    return {
      totalSales: toNumber(totalSales._sum!.total),
      totalPurchases: 0,
      totalExpenses: 0,
      totalPaymentsReceived: cashIn,
      netCashFlow: cashIn - cashOut,
      outstandingReceivables: toNumber(outstandingReceivables._sum!.balanceAmount),
      overdueReceivables: toNumber(overdueReceivables._sum!.balanceAmount),
      customerCount,
      vendorCount: 0,
      invoiceCount,
      orderCount,
      totalProducts: productCount,
      lowStockCount: Number(lowStockCountResult[0]?.count || 0),
      totalStockValue: toNumber(valuationInfo.totalValue),
      valuationMethod: valuationInfo.method,
      lowStockItems: (lowStockItemsResult as Array<{ id: string; sku: string; name: string; stockQuantity: number; minStockLevel: number }>).map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
      })),
    };
  }

  async getSalesReport(tenantId: string, query: SalesQueryDto) {
    try {
      const range = buildDateRange(query);
      const where = buildInvoiceWhere(tenantId, range, query.status, query.clientId, query.projectId);

      const [
        totals,
        byMonth,
        byCustomer,
        byStatus,
        byProject,
      ] = await this.prisma.$transaction([
        this.prisma.invoice.aggregate({
          where,
          _sum: { total: true, paidAmount: true, balanceAmount: true },
          _count: { id: true },
          _avg: { total: true },
        }),
        this.prisma.invoice.groupBy({
          by: ['issueDate'],
          where,
          _sum: { total: true },
          orderBy: { issueDate: 'asc' },
        }),
        this.prisma.invoice.groupBy({
          by: ['clientId'],
          where,
          _sum: { total: true, paidAmount: true, balanceAmount: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 10,
        }),
        this.prisma.invoice.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          _sum: { total: true },
          orderBy: { status: 'asc' },
        }),
        this.prisma.invoice.groupBy({
          by: ['projectId'],
          where,
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 10,
        }),
      ]);

      const clients = await this.prisma.client.findMany({
        where: { tenantId },
        select: { id: true, companyName: true },
      });

      const clientMap = new Map(clients.map((c) => [c.id, c.companyName]));

      const projects = await this.prisma.project.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      });

      const projectMap = new Map<string, string>(projects.map((p) => [p.id, p.name ?? '']));

      return {
        totalSales: toNumber(totals._sum!.total),
        totalInvoices: totals._count.id,
        averageInvoiceValue: toNumber(totals._avg!.total),
        totalPaid: toNumber(totals._sum!.paidAmount),
        totalOutstanding: toNumber(totals._sum!.balanceAmount),
        salesByMonth: byMonth.map((row) => ({
          month: (row as any).issueDate.toISOString().slice(0, 7),
          total: toNumber(row._sum!.total),
        })),
        salesByCustomer: byCustomer.map((row) => ({
          clientId: row.clientId,
          clientName: clientMap.get(row.clientId) || 'Unknown',
          total: toNumber(row._sum!.total),
          paid: toNumber(row._sum!.paidAmount),
          outstanding: toNumber(row._sum!.balanceAmount),
        })),
        salesByStatus: byStatus.map((row) => ({
          status: row.status,
          count: (row._count as any).id,
          total: toNumber(row._sum!.total),
        })),
        salesByProject: byProject.map((row) => {
          const projectName = row.projectId ? (projectMap.get(row.projectId) as string) : 'Unknown';
          return {
            projectId: row.projectId,
            projectName,
            total: toNumber(row._sum!.total),
          };
        }),
      };
    } catch (error: any) {
      throw error;
    }
  }

  async getReceivablesReport(tenantId: string, _query?: ReceivablesQueryDto) {
    const receivables = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: 0 },
      },
      include: {
        client: { select: { id: true, companyName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const aging = {
      current: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
    };

    const topOutstanding: any[] = [];

    for (const invoice of receivables) {
      const balance = toNumber(invoice.balanceAmount);
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        aging.current += balance;
      } else if (daysOverdue <= 30) {
        aging.current += balance;
      } else if (daysOverdue <= 60) {
        aging.days31to60 += balance;
      } else if (daysOverdue <= 90) {
        aging.days61to90 += balance;
      } else {
        aging.days90plus += balance;
      }

      topOutstanding.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.client?.companyName || 'Unknown',
        balanceAmount: balance,
        dueDate: invoice.dueDate,
        daysOverdue: Math.max(0, daysOverdue),
        status: invoice.status,
      });
    }

    topOutstanding.sort((a, b) => b.balanceAmount - a.balanceAmount);

    const totalReceivables = receivables.reduce((sum, inv) => sum.plus(new Prisma.Decimal(inv.balanceAmount)), new Prisma.Decimal(0)).toNumber();

    return {
      totalReceivables,
      aging: {
        current: aging.current,
        days31to60: aging.days31to60,
        days61to90: aging.days61to90,
        days90plus: aging.days90plus,
      },
      invoiceCount: receivables.length,
      topOutstandingCustomers: topOutstanding.slice(0, 10),
    };
  }

  async getPayablesReport(tenantId: string, _query?: PayablesQueryDto) {
    const bills = await this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        status: { in: [PurchaseInvoiceStatus.POSTED, PurchaseInvoiceStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: 0 },
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const aging = {
      current: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
    };

    const topOutstanding: any[] = [];

    for (const bill of bills) {
      const balance = toNumber(bill.balanceAmount);
      const dueDate = new Date(bill.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        aging.current += balance;
      } else if (daysOverdue <= 30) {
        aging.current += balance;
      } else if (daysOverdue <= 60) {
        aging.days31to60 += balance;
      } else if (daysOverdue <= 90) {
        aging.days61to90 += balance;
      } else {
        aging.days90plus += balance;
      }

      topOutstanding.push({
        purchaseInvoiceId: bill.id,
        invoiceNumber: bill.invoiceNumber,
        vendorId: bill.vendor?.id,
        vendorName: bill.vendor?.name || 'Unknown',
        balanceAmount: balance,
        dueDate: bill.dueDate,
        daysOverdue: Math.max(0, daysOverdue),
        status: bill.status,
      });
    }

    topOutstanding.sort((a, b) => b.balanceAmount - a.balanceAmount);

    const totalPayables = bills
      .reduce((sum, b) => sum.plus(new Prisma.Decimal(b.balanceAmount)), new Prisma.Decimal(0))
      .toNumber();

    return {
      totalPayables,
      aging: {
        current: aging.current,
        days31to60: aging.days31to60,
        days61to90: aging.days61to90,
        days90plus: aging.days90plus,
      },
      billCount: bills.length,
      topOutstandingVendors: topOutstanding.slice(0, 10),
    };
  }

  async getExpenseReport(tenantId: string, query: ExpenseQueryDto) {
    try {
      const where: any = { tenantId };

      if (query.category) {
        where.category = { contains: query.category, mode: Prisma.QueryMode.insensitive };
      }

      if (query.search) {
        where.OR = [
          { description: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          { category: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        ];
      }

      const [totals, byCategory, byMonth] = await this.prisma.$transaction([
        this.prisma.expense.aggregate({
          where,
          _sum: { amount: true },
          _count: { id: true },
        }),
        this.prisma.expense.groupBy({
          by: ['category'],
          where,
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
        }),
        this.prisma.expense.groupBy({
          by: ['expenseDate'],
          where,
          _sum: { amount: true },
          orderBy: { expenseDate: 'asc' },
        }),
      ]);

    return {
      available: true,
      totalExpenses: toNumber(totals._sum!.amount),
      expenseCount: totals._count.id,
      byCategory: byCategory.map((row) => ({
        category: row.category,
        total: toNumber(row._sum!.amount),
      })),
      byMonth: byMonth.map((row) => ({
        month: row.expenseDate.toISOString().slice(0, 7),
        total: toNumber(row._sum!.amount),
      })),
      };
    } catch (error: any) {
      throw error;
    }
  }

  async getPurchaseReport(tenantId: string, query: PurchaseQueryDto) {
    const where: any = { tenantId };

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { referenceNo: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        {
          vendorInfo: {
            name: { contains: query.search, mode: Prisma.QueryMode.insensitive },
          },
        },
      ];
    }

    const [totals, byVendor, byMonth] = await this.prisma.$transaction([
      this.prisma.purchase.aggregate({
        where,
        _sum: { total: true },
        _count: { id: true },
      }),
        this.prisma.purchase.groupBy({
          by: ['vendorId'],
          where,
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
        }),
      this.prisma.purchase.groupBy({
        by: ['purchaseDate'],
        where,
        _sum: { total: true },
        orderBy: { purchaseDate: 'asc' },
      }),
    ]);

    const vendors = await this.prisma.vendor.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

    return {
      available: true,
      totalPurchases: toNumber(totals._sum!.total),
      purchaseCount: totals._count.id,
      byVendor: byVendor.map((row) => ({
        vendorId: row.vendorId,
        vendorName: vendorMap.get(row.vendorId) || 'Unknown',
        total: toNumber(row._sum!.total),
      })),
      byMonth: byMonth.map((row) => ({
        month: row.purchaseDate.toISOString().slice(0, 7),
        total: toNumber(row._sum!.total),
      })),
    };
  }

  async getCustomerReport(tenantId: string, _query: CustomerQueryDto) {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, isActive: true },
      include: {
        invoices: {
          where: {
            status: { not: 'DRAFT' },
          },
          select: {
            id: true,
            total: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
            clientId: true,
          },
        },
      },
    });

    const customerData = clients.map((client) => {
      const sales = client.invoices.reduce((sum, inv) => sum.plus(new Prisma.Decimal(inv.total)), new Prisma.Decimal(0)).toNumber();
      const outstanding = client.invoices.reduce((sum, inv) => sum.plus(new Prisma.Decimal(inv.balanceAmount)), new Prisma.Decimal(0)).toNumber();
      const paid = client.invoices.reduce((sum, inv) => sum.plus(new Prisma.Decimal(inv.paidAmount)), new Prisma.Decimal(0)).toNumber();

      return {
        clientId: client.id,
        clientName: client.companyName,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        sales,
        paid,
        outstanding,
        invoiceCount: client.invoices.length,
      };
    });

    customerData.sort((a, b) => b.sales - a.sales);

    return {
      customerCount: clients.length,
      customers: customerData.slice(0, 50),
      topCustomers: customerData.slice(0, 10),
      topByOutstanding: [...customerData].sort((a, b) => b.outstanding - a.outstanding).slice(0, 10),
      paymentHistory: customerData.flatMap((customer) =>
        clients
          .find((c) => c.id === customer.clientId)
          ?.invoices.map((inv) => ({
            invoiceId: inv.id,
            clientId: inv.clientId,
            clientName: customer.clientName,
            total: toNumber(inv.total),
            paid: toNumber(inv.paidAmount),
            balance: toNumber(inv.balanceAmount),
            status: inv.status,
          })) ?? [],
      ),
    };
  }

  async getVendorReport(tenantId: string, _query: VendorQueryDto) {
    const vendors = await this.prisma.vendor.findMany({
      where: { tenantId, isActive: true },
      include: {
        purchases: {
          select: {
            id: true,
            total: true,
          },
        },
      },
    });

    const vendorSummaries = vendors.map((vendor: any) => {
      const purchaseStats = vendor.purchases.reduce(
        (acc: any, purchase: any) => {
          acc.count += 1;
          acc.total += toNumber(purchase.total);
          return acc;
        },
        { count: 0, total: 0 },
      );

      return {
        id: vendor.id,
        name: vendor.name,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
        isActive: vendor.isActive,
        purchaseCount: purchaseStats.count,
        totalPurchases: purchaseStats.total,
      };
    });

    const totalVendors = vendors.length;
    const activeVendors = vendors.filter((v) => v.isActive).length;

    return {
      available: true,
      totalVendors,
      activeVendors,
      vendors: vendorSummaries,
    };
  }

  async getInventoryReport(tenantId: string, query: InventoryQueryDto) {
    const where: Record<string, unknown> = { tenantId };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { sku: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [products, totalProducts, totalStockQuantity, lowStockCount, warehouseBreakdown, valuationInfo] =
      await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            warehouseStocks: {
              include: {
                warehouse: {
                  select: { id: true, name: true, location: true, isActive: true },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.product.count({ where }),
        this.prisma.product.aggregate({
          where: { tenantId, isActive: true },
          _sum: { stockQuantity: true },
        }),
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM products
          WHERE "tenantId" = ${tenantId} AND "isActive" = true AND "stockQuantity" <= "minStockLevel"
        `,
        this.prisma.$queryRaw<[{ warehouseId: string; warehouseName: string; productCount: bigint; totalQuantity: bigint }[]]>`
          SELECT
            w.id as "warehouseId",
            w.name as "warehouseName",
            COUNT(DISTINCT pw."productId") as "productCount",
            COALESCE(SUM(pw.quantity), 0) as "totalQuantity"
          FROM warehouses w
          LEFT JOIN product_warehouses pw ON pw."warehouseId" = w.id AND pw."tenantId" = w."tenantId"
          WHERE w."tenantId" = ${tenantId} AND w."isActive" = true
          GROUP BY w.id, w.name
          ORDER BY w.name ASC
        `,
        this.valuation.computeInventoryValue(tenantId),
      ]);

    const method = valuationInfo.method;
    const totalValue = toNumber(valuationInfo.totalValue);

    const byStatus = {
      active: products.filter((p) => p.isActive).length,
      inactive: products.filter((p) => !p.isActive).length,
    };

    return {
      available: true,
      valuationMethod: method,
      totalProducts,
      totalStockQuantity: toNumber(totalStockQuantity._sum!.stockQuantity),
      totalStockValue: totalValue,
      lowStockCount: Number(lowStockCount[0]?.count || 0),
      byStatus,
      products: products.map((p) => {
        const warehouseStocks = p.warehouseStocks.map((ws) => ({
          warehouseId: ws.warehouse.id,
          warehouseName: ws.warehouse.name,
          quantity: ws.quantity,
          averageCost: toNumber(ws.averageCost),
        }));
        const productValue = warehouseStocks.reduce(
          (acc, ws) => acc + ws.quantity * (ws.averageCost || toNumber(p.costPrice)),
          0,
        );
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          stockQuantity: p.stockQuantity,
          minStockLevel: p.minStockLevel,
          unitPrice: toNumber(p.unitPrice),
          costPrice: toNumber(p.costPrice),
          isActive: p.isActive,
          isLowStock: p.stockQuantity <= p.minStockLevel,
          totalValue: productValue,
          warehouseStocks,
        };
      }),
      warehouseBreakdown: (warehouseBreakdown as unknown as Array<{
        warehouseId: string;
        warehouseName: string;
        productCount: bigint;
        totalQuantity: bigint;
      }>).map((w) => ({
        warehouseId: w.warehouseId,
        warehouseName: w.warehouseName,
        productCount: Number(w.productCount),
        totalQuantity: Number(w.totalQuantity),
      })),
    };
  }

  async getProfitabilityReport(tenantId: string, query: ProfitabilityQueryDto) {
    const range = buildDateRange(query);
    const cogs = await this.valuation.computeCogs(tenantId, range.dateFrom, range.dateTo);

    const totalSalesResult = await this.prisma.invoice.aggregate({
      where: {
        ...buildInvoiceWhere(tenantId, range),
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.SENT, InvoiceStatus.OVERDUE] as InvoiceStatus[] },
      },
      _sum: { total: true },
    });
    const totalSales = toNumber(totalSalesResult._sum!.total);

    return {
      available: true,
      method: cogs.method,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      totalRevenue: totalSales,
      totalCogs: toNumber(cogs.totalCogs),
      grossProfit: totalSales - toNumber(cogs.totalCogs),
      cogsByProduct: cogs.breakdown.map((b) => ({
        productId: b.productId,
        totalCogs: toNumber(b.totalCogs),
      })),
    };
  }

  async getEmployeeDirectory(tenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: employees.length,
      data: employees.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        fullName: e.user.fullName,
        email: e.user.email,
        role: e.user.role,
        designation: e.designation,
        department: e.department,
        phone: e.phone,
        joiningDate: e.joiningDate,
        status: e.status,
      })),
    };
  }

  async getAttendanceSummary(tenantId: string, month?: string, year?: string) {
    const dateFrom = month && year ? new Date(`${year}-${month}-01`) : new Date();
    dateFrom.setDate(1);
    dateFrom.setHours(0, 0, 0, 0);

    const dateTo = new Date(dateFrom);
    dateTo.setMonth(dateTo.getMonth() + 1);
    dateTo.setDate(0);
    dateTo.setHours(23, 59, 59, 999);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        date: { gte: dateFrom, lte: dateTo },
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

    const summary = attendance.reduce((acc, a) => {
      const key = a.employeeId;
      if (!acc[key]) {
        acc[key] = {
          employeeId: a.employeeId,
          employeeName: a.employee.user.fullName,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
        };
      }
      acc[key].totalDays += 1;
      if (a.status === 'PRESENT') acc[key].presentDays += 1;
      if (a.status === 'ABSENT') acc[key].absentDays += 1;
      if (a.status === 'LATE') acc[key].lateDays += 1;
      return acc;
    }, {} as Record<string, any>);

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      summary: Object.values(summary),
    };
  }

  async getLeaveReport(tenantId: string, month?: string, year?: string) {
    const dateFrom = month && year ? new Date(`${year}-${month}-01`) : new Date();
    dateFrom.setDate(1);
    dateFrom.setHours(0, 0, 0, 0);

    const dateTo = new Date(dateFrom);
    dateTo.setMonth(dateTo.getMonth() + 1);
    dateTo.setDate(0);
    dateTo.setHours(23, 59, 59, 999);

    const leaves = await this.prisma.leave.findMany({
      where: {
        tenantId,
        startDate: { gte: dateFrom, lte: dateTo },
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

    const summary = leaves.reduce((acc, l) => {
      const key = l.status;
      if (!acc[key]) acc[key] = 0;
      acc[key] += 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      totalLeaves: leaves.length,
      byStatus: summary,
      leaves: leaves.map((l) => ({
        id: l.id,
        employeeName: l.employee.user.fullName,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status,
        reason: l.reason,
        rejectionReason: l.rejectionReason,
      })),
    };
  }

  async getPayrollSummary(tenantId: string, month?: string, year?: string) {
    const where: Record<string, unknown> = { tenantId };

    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }

    const payrolls = await this.prisma.payroll.findMany({
      where,
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

    const summary = payrolls.reduce((acc, p) => {
      const key = p.status;
      if (!acc[key]) acc[key] = 0;
      acc[key] += 1;
      return acc;
    }, {} as Record<string, number>);

    const totalNetSalary = payrolls.reduce((sum, p) => sum.plus(new Prisma.Decimal(p.netSalary)), new Prisma.Decimal(0)).toNumber();
    const totalBasicSalary = payrolls.reduce((sum, p) => sum.plus(new Prisma.Decimal(p.basicSalary)), new Prisma.Decimal(0)).toNumber();

    return {
      totalPayrolls: payrolls.length,
      totalNetSalary,
      totalBasicSalary,
      byStatus: summary,
      payrolls: payrolls.map((p) => ({
        id: p.id,
        employeeName: p.employee.user.fullName,
        month: p.month,
        year: p.year,
        basicSalary: p.basicSalary,
        netSalary: p.netSalary,
        status: p.status,
        paidAt: p.paidAt,
      })),
    };
  }

  async getSalesOrderReport(tenantId: string, query: any) {
    const where: any = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.dateFrom || query.dateTo) {
      where.orderDate = {};
      if (query.dateFrom) where.orderDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.orderDate.lte = new Date(query.dateTo);
    }

    const [orders, totalCount] = await this.prisma.$transaction([
      this.prisma.salesOrder.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          orderDate: 'desc',
        },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    const totalValue = orders.reduce((sum, order) => sum.plus(new Prisma.Decimal(order.total)), new Prisma.Decimal(0)).toNumber();

    const byStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byClient = orders.reduce((acc, order) => {
      if (!acc[order.clientId]) {
        acc[order.clientId] = {
          clientName: order.client?.companyName || 'Unknown',
          count: 0,
          total: 0,
        };
      }
      acc[order.clientId].count += 1;
      acc[order.clientId].total += Number(order.total);
      return acc;
    }, {} as Record<string, { clientName: string; count: number; total: number }>);

    return {
      totalOrders: orders.length,
      totalValue,
      byStatus,
      byClient: Object.entries(byClient).map(([clientId, data]: [string, any]) => ({
        clientId,
        ...data,
      })),
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        clientName: order.client?.companyName || 'Unknown',
        orderDate: order.orderDate,
        expectedDeliveryDate: order.expectedDeliveryDate,
        status: order.status,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
      })),
    };
  }

  async getTrialBalanceReport(tenantId: string, query?: { dateFrom?: string; dateTo?: string }) {
    return this.glService.getTrialBalance(tenantId, query);
  }

  async getProfitAndLossReport(tenantId: string, query?: { dateFrom?: string; dateTo?: string }) {
    const pnl = await this.glService.getProfitAndLoss(tenantId, query);
    return {
      totalRevenue: pnl.totalRevenue,
      totalExpenses: pnl.totalExpenses,
      netIncome: pnl.netIncome,
      byAccount: pnl.byAccount,
    };
  }

  async getGeneralLedgerReport(tenantId: string, query?: { dateFrom?: string; dateTo?: string; accountId?: string; referenceId?: string }) {
    return this.glService.getGeneralLedger(tenantId, query);
  }

  async exportReport(
    tenantId: string,
    reportType: string,
    format: string,
    query: any,
  ) {
    const csvRows: string[] = [];
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${reportType}-report-${dateStr}.csv`;

    switch (reportType) {
      case 'inventory': {
        const rep = await this.getInventoryReport(tenantId, query || {});
        csvRows.push('SKU,Product Name,Quantity,Reorder Level,Status,Total Value');
        for (const p of rep.products || []) {
          csvRows.push(
            `"${p.sku}","${p.name}",${p.stockQuantity},${p.minStockLevel},${p.isActive ? 'ACTIVE' : 'INACTIVE'},${p.totalValue}`,
          );
        }
        break;
      }
      case 'sales': {
        const rep = await this.getSalesReport(tenantId, query || {});
        csvRows.push('Invoice Number,Client,Issue Date,Due Date,Status,Total,Paid,Balance');
        for (const inv of (rep as any).invoices || []) {
          csvRows.push(
            `"${inv.invoiceNumber}","${inv.client?.companyName || ''}",${inv.issueDate},${inv.dueDate},${inv.status},${inv.total},${inv.paidAmount},${inv.balanceAmount}`,
          );
        }
        break;
      }
      case 'expenses': {
        const rep = await this.getExpenseReport(tenantId, query || {});
        csvRows.push('Category,Total');
        for (const row of rep.byCategory || []) {
          csvRows.push(`"${row.category}",${row.total}`);
        }
        break;
      }
      case 'customers': {
        const rep = await this.getCustomerReport(tenantId, query || {});
        csvRows.push('Customer,Contact Person,Email,Sales,Paid,Outstanding');
        for (const c of rep.customers || []) {
          csvRows.push(
            `"${c.clientName}","${c.contactPerson || ''}","${c.email || ''}",${c.sales},${c.paid},${c.outstanding}`,
          );
        }
        break;
      }
      case 'vendors': {
        const rep = await this.getVendorReport(tenantId, query || {});
        csvRows.push('Vendor Name,Contact Person,Email,Purchases Count,Total Purchases');
        for (const v of rep.vendors || []) {
          csvRows.push(
            `"${v.name}","${v.contactPerson || ''}","${v.email || ''}",${v.purchaseCount},${v.totalPurchases}`,
          );
        }
        break;
      }
      default: {
        csvRows.push('Report Type,Export Date,Tenant ID');
        csvRows.push(`"${reportType}","${dateStr}","${tenantId}"`);
        break;
      }
    }

    const csvContent = csvRows.join('\n');
    return {
      buffer: Buffer.from(csvContent, 'utf-8'),
      filename,
      contentType: 'text/csv',
    };
  }
}
