import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.EMPLOYEE,
)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.getByTenant(pagination, search, user.tenantId);
  }

  @Get(':productId')
  findOne(@Param('productId') productId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.getByProduct(productId, user.tenantId);
  }

  @Get(':productId/movements')
  getMovements(@Param('productId') productId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.getMovements(productId, user.tenantId);
  }

  @Post(':productId/adjust')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  adjust(
    @Param('productId') productId: string,
    @Body() body: { type: string; quantity: number; note: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.adjustStock(
      productId,
      body.type as any,
      body.quantity,
      body.note,
      user.tenantId,
      user.id,
    );
  }
}
