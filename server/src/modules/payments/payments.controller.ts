import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AllocatePaymentDto } from './dto/allocate-payment.dto';
import { GetUser } from '../../modules/auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @GetUser() user: AuthenticatedUser) {
    return this.paymentsService.create(dto, user.tenantId, user.id);
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.paymentsService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.paymentsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.update(id, dto, user.tenantId, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.paymentsService.remove(id, user.tenantId, user.id);
  }

  @Post(':id/allocate')
  allocatePayment(
    @Param('id') id: string,
    @Body() dto: AllocatePaymentDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.allocatePayment(id, dto, user.tenantId, user.id);
  }

  @HttpCode(200)
  @Post(':id/reverse')
  reversePayment(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.paymentsService.reversePayment(id, user.tenantId, user.id);
  }

  @HttpCode(200)
  @Post(':id/void')
  voidPayment(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.paymentsService.voidPayment(id, user.tenantId, user.id);
  }
}
