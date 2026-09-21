import { Controller, Post, UseGuards, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { LifecycleService, LifecycleRunResult, OverdueInvoicesResult, ExpiredSubscriptionsResult } from './lifecycle.service';

@Controller('lifecycle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LifecycleController {
  constructor(private readonly lifecycleService: LifecycleService) {}

  @Post('run')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async runAll(
    @GetUser() user: AuthenticatedUser,
    @Query('tenantId') queryTenantId?: string,
  ): Promise<LifecycleRunResult> {
    const targetTenantId = user.role === UserRole.SUPER_ADMIN ? queryTenantId : user.tenantId;
    return this.lifecycleService.processAll(targetTenantId);
  }

  @Post('invoices/overdue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async runOverdueInvoices(
    @GetUser() user: AuthenticatedUser,
    @Query('tenantId') queryTenantId?: string,
  ): Promise<OverdueInvoicesResult> {
    const targetTenantId = user.role === UserRole.SUPER_ADMIN ? queryTenantId : user.tenantId;
    return this.lifecycleService.processOverdueInvoices(targetTenantId);
  }

  @Post('subscriptions/expired')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async runExpiredSubscriptions(
    @GetUser() user: AuthenticatedUser,
    @Query('tenantId') queryTenantId?: string,
  ): Promise<ExpiredSubscriptionsResult> {
    const targetTenantId = user.role === UserRole.SUPER_ADMIN ? queryTenantId : user.tenantId;
    return this.lifecycleService.processExpiredSubscriptions(targetTenantId);
  }
}
