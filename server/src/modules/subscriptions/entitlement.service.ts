import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../../database';

@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async hasFeature(tenantId: string, featureCode: string): Promise<boolean> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: { include: { features: true } } },
    });

    if (!subscription) {
      return false;
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
      return false;
    }

    if (
      subscription.status === 'TRIAL' &&
      subscription.trialEndDate &&
      new Date() > subscription.trialEndDate
    ) {
      return false;
    }

    return subscription.plan.features.some(
      (f) => f.featureCode === featureCode || f.featureCode === 'ALL',
    );
  }

  async getLimit(
    tenantId: string,
    resourceCode: string,
  ): Promise<number | null> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: { include: { limits: true } } },
    });

    if (!subscription) {
      return null;
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
      return null;
    }

    if (
      subscription.status === 'TRIAL' &&
      subscription.trialEndDate &&
      new Date() > subscription.trialEndDate
    ) {
      return null;
    }

    const limit = subscription.plan.limits.find(
      (l) => l.resourceCode === resourceCode,
    );

    return limit ? limit.limitValue : null;
  }

  async checkLimit(
    tenantId: string,
    resourceCode: string,
    requestedAmount = 1,
  ): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    const limit = await this.getLimit(tenantId, resourceCode);

    if (limit === null) {
      return { allowed: true, limit: null, current: 0 };
    }

    if (limit === -1) {
      return { allowed: true, limit: -1, current: 0 };
    }

    const current = await this.getCurrentUsage(tenantId, resourceCode);

    return {
      allowed: current + requestedAmount <= limit,
      limit,
      current,
    };
  }

  async enforceLimit(
    tenantId: string,
    resourceCode: string,
    requestedAmount = 1,
  ): Promise<void> {
    const result = await this.checkLimit(tenantId, resourceCode, requestedAmount);
    if (!result.allowed) {
      throw new ForbiddenException(
        `Plan limit reached for ${resourceCode}. Limit: ${result.limit}, Current: ${result.current}. Please upgrade your subscription plan to add more.`,
      );
    }
  }

  async enforceFeature(
    tenantId: string,
    featureCode: string,
  ): Promise<void> {
    const has = await this.hasFeature(tenantId, featureCode);
    if (!has) {
      throw new ForbiddenException(
        `Your plan does not have access to feature '${featureCode}'. Please upgrade your subscription plan.`,
      );
    }
  }

  async getEntitlements(tenantId: string) {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: {
        plan: {
          include: {
            features: true,
            limits: true,
          },
        },
      },
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        features: [],
        limits: [],
      };
    }

    return {
      hasSubscription: true,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        code: subscription.plan.code,
      },
      features: subscription.plan.features.map((f) => ({
        featureCode: f.featureCode,
        description: f.description,
      })),
      limits: subscription.plan.limits.map((l) => ({
        resourceCode: l.resourceCode,
        limitValue: l.limitValue,
      })),
    };
  }

  async getLimits(tenantId: string) {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: { include: { limits: true } } },
    });

    if (!subscription) {
      return [];
    }

    return subscription.plan.limits.map((l) => ({
      resourceCode: l.resourceCode,
      limitValue: l.limitValue,
    }));
  }

  private async getCurrentUsage(
    tenantId: string,
    resourceCode: string,
  ): Promise<number> {
    switch (resourceCode) {
      case 'MAX_USERS':
        return this.prisma.user.count({ where: { tenantId } });
      case 'MAX_EMPLOYEES':
        return this.prisma.employee.count({ where: { tenantId } });
      case 'MAX_CLIENTS':
        return this.prisma.client.count({ where: { tenantId } });
      case 'MAX_PROJECTS':
        return this.prisma.project.count({ where: { tenantId } });
      case 'MAX_PRODUCTS':
        return this.prisma.product.count({ where: { tenantId } });
      case 'MAX_VENDORS':
        return this.prisma.vendor.count({ where: { tenantId } });
      case 'MAX_WAREHOUSES':
        return this.prisma.warehouse.count({ where: { tenantId } });
      case 'MAX_INVOICES':
        return this.prisma.invoice.count({ where: { tenantId } });
      case 'MAX_SALES_ORDERS':
        return this.prisma.salesOrder.count({ where: { tenantId } });
      case 'MAX_PURCHASES':
        return this.prisma.purchase.count({ where: { tenantId } });
      case 'MAX_EXPENSES':
        return this.prisma.expense.count({ where: { tenantId } });
      default:
        return 0;
    }
  }
}
