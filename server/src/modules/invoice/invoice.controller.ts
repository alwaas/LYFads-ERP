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

import { InvoiceService } from './invoice.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateInvoiceFromSalesOrderDto } from './dto/create-invoice-from-sales-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Controller('invoice')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoiceService.create(dto, user.tenantId, user.id);
  }

  @Post('from-sales-order/:salesOrderId')
  createFromSalesOrder(
    @Param('salesOrderId') salesOrderId: string,
    @Body() dto: CreateInvoiceFromSalesOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoiceService.createFromSalesOrder(salesOrderId, dto, user.tenantId, user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') searchQuery?: string,
    @Query('status') status?: string,
  ) {
    return this.invoiceService.findAll(user.tenantId, searchQuery, status);
  }

  @Get('ar-summary')
  getARSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.invoiceService.getARSummary(user.tenantId);
  }

  @Get('client-ledger/:clientId')
  getCustomerLedger(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoiceService.getCustomerLedger(clientId, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoiceService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoiceService.update(id, dto, user.tenantId, user.id);
  }

  @Post(':id/issue')
  issue(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoiceService.issue(id, user.tenantId, user.id);
  }

  @Post(':id/void')
  voidInvoice(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoiceService.voidInvoice(id, user.tenantId, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoiceService.remove(id, user.tenantId, user.id);
  }
}
