import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthenticatedUser } from '../../../common/types/auth-user.type';

@Injectable()
export class TenantStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      return true;
    }

    const userId = user.userId || user.id;

    // Run user, tenant, and subscription checks concurrently to eliminate sequential DB round-trip latency
    const userPromise = userId
      ? this.prisma.user.findUnique({
          where: { id: userId },
          select: { isActive: true },
        })
      : Promise.resolve(null);

    const tenantPromise = user.tenantId
      ? this.prisma.tenant.findUnique({
          where: { id: user.tenantId },
          select: { id: true, status: true },
        })
      : Promise.resolve(null);

    const subPromise =
      user.tenantId && user.role !== 'SUPER_ADMIN'
        ? this.prisma.tenantSubscription.findUnique({
            where: { tenantId: user.tenantId },
            select: { id: true, status: true, trialEndDate: true, endDate: true },
          })
        : Promise.resolve(null);

    const [dbUser, tenant, subscription] = await Promise.all([
      userPromise,
      tenantPromise,
      subPromise,
    ]);

    if (userId) {
      if (!dbUser || !dbUser.isActive) {
        throw new ForbiddenException('User account is inactive or disabled.');
      }
    }

    if (!user.tenantId) {
      return true;
    }

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Tenant account is not active. Please contact support.',
      );
    }

    if (user.role !== 'SUPER_ADMIN') {
      if (!subscription) {
        throw new ForbiddenException(
          'No subscription found for this tenant. Please contact support.',
        );
      }

      if (subscription.status === 'CANCELLED') {
        throw new ForbiddenException(
          'Subscription has been cancelled. Please contact support.',
        );
      }

      if (subscription.status === 'EXPIRED') {
        throw new ForbiddenException(
          'Subscription has expired. Please contact support.',
        );
      }

      if (subscription.status === 'PAST_DUE') {
        throw new ForbiddenException(
          'Subscription payment is past due. Please update your payment method.',
        );
      }

      if (subscription.trialEndDate && new Date() > subscription.trialEndDate) {
        if (subscription.status === 'TRIAL') {
          throw new ForbiddenException(
            'Trial period has expired. Please subscribe to continue using the system.',
          );
        }
      }

      if (subscription.endDate && new Date() > subscription.endDate) {
        const status = subscription.status as string;
        if (status !== 'CANCELLED' && status !== 'EXPIRED') {
          throw new ForbiddenException(
            'Subscription period has ended. Please contact support.',
          );
        }
      }
    }

    return true;
  }
}
