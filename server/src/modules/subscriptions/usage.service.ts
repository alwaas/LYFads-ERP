import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database';

export interface UsageItem {
  resource: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsage(tenantId: string): Promise<{
    hasSubscription: boolean;
    usage: UsageItem[];
  }> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: { include: { limits: true } } },
    });

    if (!subscription) {
      const usage = await this.calculateUsage(tenantId, null);
      return { hasSubscription: false, usage };
    }

    const limitsMap = new Map(
      subscription.plan.limits.map((l) => [l.resourceCode, l.limitValue]),
    );

    const usage = await this.calculateUsage(tenantId, limitsMap);

    return { hasSubscription: true, usage };
  }

  private async calculateUsage(
    tenantId: string,
    limitsMap: Map<string, number> | null,
  ): Promise<UsageItem[]> {
    const [
      users,
      employees,
      clients,
      projects,
      products,
      vendors,
      warehouses,
      invoices,
      salesOrders,
      purchases,
      expenses,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.vendor.count({ where: { tenantId } }),
      this.prisma.warehouse.count({ where: { tenantId } }),
      this.prisma.invoice.count({ where: { tenantId } }),
      this.prisma.salesOrder.count({ where: { tenantId } }),
      this.prisma.purchase.count({ where: { tenantId } }),
      this.prisma.expense.count({ where: { tenantId } }),
    ]);

    const resources = [
      { resource: 'users', used: users, code: 'MAX_USERS' },
      { resource: 'employees', used: employees, code: 'MAX_EMPLOYEES' },
      { resource: 'clients', used: clients, code: 'MAX_CLIENTS' },
      { resource: 'projects', used: projects, code: 'MAX_PROJECTS' },
      { resource: 'products', used: products, code: 'MAX_PRODUCTS' },
      { resource: 'vendors', used: vendors, code: 'MAX_VENDORS' },
      { resource: 'warehouses', used: warehouses, code: 'MAX_WAREHOUSES' },
      { resource: 'invoices', used: invoices, code: 'MAX_INVOICES' },
      { resource: 'salesOrders', used: salesOrders, code: 'MAX_SALES_ORDERS' },
      { resource: 'purchases', used: purchases, code: 'MAX_PURCHASES' },
      { resource: 'expenses', used: expenses, code: 'MAX_EXPENSES' },
    ];

    return resources.map(({ resource, used, code }) => {
      const limit = limitsMap ? limitsMap.get(code) ?? null : null;
      const unlimited = limit === -1;
      const remaining = limit === null ? null : limit === -1 ? null : limit - used;

      return {
        resource,
        used,
        limit,
        remaining,
        unlimited,
      };
    });
  }
}
