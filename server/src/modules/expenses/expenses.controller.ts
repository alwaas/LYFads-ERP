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

import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { RecordExpensePaymentDto } from './dto/record-expense-payment.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @Post()
  create(@Body() dto: CreateExpenseDto, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.create(dto, user.tenantId, user.userId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  findAll(@Query() query: ExpenseQueryDto, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.findAll(query, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.findOne(id, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.update(id, dto, user.tenantId, user.userId, user.role);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @Patch(':id/submit')
  submit(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.submit(id, user.tenantId, user.userId, user.role);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.approve(id, user.tenantId, user.userId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.reject(id, user.tenantId, user.userId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/post')
  post(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.post(id, user.tenantId, user.userId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.cancel(id, user.tenantId, user.userId, user.role);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post(':id/post-to-ledger')
  postToLedger(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.postToLedger(id, user.tenantId, user.userId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/payment')
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordExpensePaymentDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.recordPayment(
      id,
      dto,
      user.tenantId,
      user.userId,
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.remove(id, user.tenantId, user.userId);
  }
}
