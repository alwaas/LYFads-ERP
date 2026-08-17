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

    if (!user || !user.tenantId) {
      return true;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: user.tenantId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Tenant account is not active. Please contact support.',
      );
    }

    return true;
  }
}
