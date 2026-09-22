import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

import { SubscriptionsService } from './subscriptions.service';
import { EntitlementService } from './entitlement.service';
import { UsageService } from './usage.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly entitlementService: EntitlementService,
    private readonly usageService: UsageService,
  ) {}

  @Get('subscriptions/current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getCurrentSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.findByTenantId(user.tenantId);
  }

  @Get('tenants/:id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  getTenantSubscription(@Param('id') id: string) {
    return this.subscriptionsService.findByTenantId(id);
  }

  @Post('tenants/:id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  assignSubscription(
    @Param('id') id: string,
    @Body() dto: AssignSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.assign(id, dto, user.id);
  }

  @Patch('tenants/:id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.update(id, dto, user.id);
  }

  @Post('tenants/:id/subscription/cancel')
  @Roles(UserRole.SUPER_ADMIN)
  cancelSubscription(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.cancel(id, user.id);
  }

  @Get('tenants/current/usage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getCurrentUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.usageService.getUsage(user.tenantId);
  }

  @Get('tenants/current/limits')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getCurrentLimits(@CurrentUser() user: AuthenticatedUser) {
    return this.entitlementService.getLimits(user.tenantId);
  }

  @Get('tenants/current/entitlements')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getCurrentEntitlements(@CurrentUser() user: AuthenticatedUser) {
    return this.entitlementService.getEntitlements(user.tenantId);
  }
}
