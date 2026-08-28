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

import { SalesOrdersService } from './sales-orders.service';

import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { SalesOrderQueryDto } from './dto/sales-order-query.dto';

@Controller('sales-orders')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  create(
    @Body() dto: CreateSalesOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.create(dto, user.tenantId, user.userId);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @Query() query: SalesOrderQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.findAll(pagination, search, query, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.salesOrdersService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.update(id, dto, user.tenantId, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.salesOrdersService.remove(id, user.tenantId, user.userId);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.salesOrdersService.updateStatus(id, 'CONFIRMED', user.tenantId, user.userId);
  }

  @Post(':id/process')
  process(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.salesOrdersService.updateStatus(id, 'PROCESSING', user.tenantId, user.userId);
  }

  @Post(':id/fulfill')
  fulfill(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.salesOrdersService.updateStatus(id, 'FULFILLED', user.tenantId, user.userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.salesOrdersService.updateStatus(id, 'CANCELLED', user.tenantId, user.userId);
  }
}
