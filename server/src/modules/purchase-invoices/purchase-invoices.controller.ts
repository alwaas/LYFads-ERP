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

import { UserRole, PurchaseInvoiceStatus } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { PurchaseInvoicesService } from './purchase-invoices.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { PurchaseInvoiceQueryDto } from './dto/purchase-invoice-query.dto';

@Controller(['purchase-invoices', 'vendor-bills'])
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class PurchaseInvoicesController {
  constructor(private readonly purchaseInvoicesService: PurchaseInvoicesService) {}

  @Post()
  create(
    @Body() dto: CreatePurchaseInvoiceDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.purchaseInvoicesService.create(dto, user.tenantId, user.userId);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @Query() query: PurchaseInvoiceQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.purchaseInvoicesService.findAll(pagination, search, query, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseInvoicesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseInvoiceDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.purchaseInvoicesService.update(id, dto, user.tenantId, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseInvoicesService.remove(id, user.tenantId, user.userId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseInvoicesService.updateStatus(
      id,
      PurchaseInvoiceStatus.APPROVED,
      user.tenantId,
      user.userId,
    );
  }

  @Post(':id/post')
  post(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseInvoicesService.updateStatus(
      id,
      PurchaseInvoiceStatus.POSTED,
      user.tenantId,
      user.userId,
    );
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseInvoicesService.updateStatus(
      id,
      PurchaseInvoiceStatus.CANCELLED,
      user.tenantId,
      user.userId,
    );
  }

  @Post(':id/void')
  void(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.purchaseInvoicesService.updateStatus(
      id,
      PurchaseInvoiceStatus.VOIDED,
      user.tenantId,
      user.userId,
    );
  }
}
