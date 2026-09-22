import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { InventoryValuationMethod, UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { GetUser } from '../auth/decorators/get-user.decorator';

import { SettingsService } from './settings.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getSettings(@GetUser() user: AuthenticatedUser) {
    return this.settingsService.getSettings(user.tenantId);
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateSettings(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: any,
  ) {
    return this.settingsService.updateSettings(user.tenantId, dto);
  }

  @Get('inventory-valuation')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getInventoryValuation(@GetUser() user: AuthenticatedUser) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, inventoryValuationMethod: true },
    });
    return {
      inventoryValuationMethod: tenant?.inventoryValuationMethod ?? 'WEIGHTED_AVERAGE',
    };
  }

  @Patch('inventory-valuation')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateInventoryValuation(
    @GetUser() user: AuthenticatedUser,
    @Body() body: { inventoryValuationMethod: InventoryValuationMethod },
  ) {
    if (
      !body ||
      !body.inventoryValuationMethod ||
      !Object.values(InventoryValuationMethod).includes(body.inventoryValuationMethod)
    ) {
      throw new BadRequestException(
        'inventoryValuationMethod must be FIFO or WEIGHTED_AVERAGE',
      );
    }
    const updated = await this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: { inventoryValuationMethod: body.inventoryValuationMethod },
      select: { id: true, inventoryValuationMethod: true },
    });
    return updated;
  }
}
