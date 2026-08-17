import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetUser } from '../../modules/auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @GetUser() user: AuthenticatedUser) {
    return this.paymentsService.create(dto, user.tenantId);
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
    return this.paymentsService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.paymentsService.remove(id, user.tenantId);
  }
}
