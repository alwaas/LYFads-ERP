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

import { InvoiceService } from './invoice.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('invoice')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoiceService.create(dto, user.tenantId, user.id);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.invoiceService.findAll(pagination, search, status, user.tenantId);
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

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoiceService.remove(id, user.tenantId, user.id);
  }
}
