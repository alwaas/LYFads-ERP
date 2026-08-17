import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { InvoiceItemsService } from './invoice-items.service';

import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';
import { GetUser } from '../../modules/auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Controller('invoice-items')
export class InvoiceItemsController {
  constructor(private readonly service: InvoiceItemsService) {}

  @Post()
  create(
    @Body() dto: CreateInvoiceItemDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.tenantId);
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceItemDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.tenantId);
  }
}
