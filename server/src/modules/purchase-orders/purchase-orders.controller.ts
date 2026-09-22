import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

import { PurchaseOrdersService } from './purchase-orders.service';

import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrdersService.create(dto, user.tenantId, user.userId);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @Query() query: PurchaseOrderQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrdersService.findAll(pagination, search, query, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrdersService.update(id, dto, user.tenantId, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.remove(id, user.tenantId, user.userId);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.updateStatus(id, 'SUBMITTED', user.tenantId, user.userId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.updateStatus(id, 'APPROVED', user.tenantId, user.userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.updateStatus(id, 'CANCELLED', user.tenantId, user.userId);
  }

  @Post(':id/receive')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrdersService.receive(id, dto, user.tenantId, user.userId);
  }
}
