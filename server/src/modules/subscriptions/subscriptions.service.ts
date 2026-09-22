import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

const SUBSCRIPTION_INCLUDE = {
  plan: {
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      price: true,
      billingInterval: true,
      features: true,
      limits: true,
    },
  },
} as const;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findByTenantId(tenantId: string) {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: SUBSCRIPTION_INCLUDE,
    });

    return subscription;
  }

  async assign(
    tenantId: string,
    dto: AssignSubscriptionDto,
    userId: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (!plan.isActive) {
      throw new ConflictException('Cannot assign an inactive plan');
    }

    const existing = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
    });

    if (existing) {
      throw new ConflictException(
        'Tenant already has a subscription. Update the existing subscription instead.',
      );
    }

    const subscription = await this.prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId: dto.planId,
        status: (dto.status as any) ?? 'ACTIVE',
        startDate: dto.startDate ?? new Date(),
        endDate: dto.endDate,
        trialEndDate: dto.trialEndDate,
        autoRenew: dto.autoRenew ?? true,
      },
      include: SUBSCRIPTION_INCLUDE,
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'SUBSCRIPTION',
      description: `Subscription assigned: ${plan.name} (${plan.code})`,
      userId,
      tenantId,
    });

    return subscription;
  }

  async update(
    tenantId: string,
    dto: UpdateSubscriptionDto,
    userId: string,
  ) {
    const existing = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found for this tenant');
    }

    if (dto.planId && dto.planId !== existing.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });
      if (!plan) {
        throw new NotFoundException('Plan not found');
      }
      if (!plan.isActive) {
        throw new ConflictException('Cannot assign an inactive plan');
      }
    }

    const subscription = await this.prisma.tenantSubscription.update({
      where: { tenantId },
      data: {
        ...(dto.planId !== undefined && { planId: dto.planId }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.trialEndDate !== undefined && { trialEndDate: dto.trialEndDate }),
        ...(dto.autoRenew !== undefined && { autoRenew: dto.autoRenew }),
      },
      include: SUBSCRIPTION_INCLUDE,
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'SUBSCRIPTION',
      description: `Subscription updated: status ${subscription.status}`,
      userId,
      tenantId,
    });

    return subscription;
  }

  async cancel(tenantId: string, userId: string) {
    const existing = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found for this tenant');
    }

    const subscription = await this.prisma.tenantSubscription.update({
      where: { tenantId },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
      include: SUBSCRIPTION_INCLUDE,
    });

    await this.activityLogsService.log({
      action: 'CANCEL',
      module: 'SUBSCRIPTION',
      description: 'Subscription cancelled',
      userId,
      tenantId,
    });

    return subscription;
  }
}
