import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PaymentAllocationsService } from './payment-allocations.service';

import { CreatePaymentAllocationDto } from './dto/create-payment-allocation.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('payment-allocations')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class PaymentAllocationsController {
  constructor(private readonly paymentAllocationsService: PaymentAllocationsService) {}

  @Post()
  create(
    @Body() dto: CreatePaymentAllocationDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.paymentAllocationsService.create(dto, user.tenantId, user.userId);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.paymentAllocationsService.findAll(pagination, search, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.paymentAllocationsService.findOne(id, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.paymentAllocationsService.remove(id, user.tenantId, user.userId);
  }
}
