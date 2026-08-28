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

import { PayrollService } from './payroll.service';

import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  create(@Body() dto: CreatePayrollDto, @GetUser() user: AuthenticatedUser) {
    return this.payrollService.create(dto, user.tenantId);
  }

  @Post('calculate')
  calculate(
    @Body('employeeId') employeeId: string,
    @Body('month') month: number,
    @Body('year') year: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.payrollService.calculate(user.tenantId, employeeId, month, year);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.payrollService.findAll(pagination, search, user.tenantId, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.payrollService.findOne(id, user.tenantId, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.payrollService.update(id, dto, user.tenantId);
  }

  @Post(':id/process')
  process(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.payrollService.process(id, user.tenantId, user.userId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.payrollService.approve(id, user.tenantId, user.userId);
  }

  @Post(':id/mark-paid')
  markPaid(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
    @Body('paymentMethod') paymentMethod: string,
    @Body('paymentReference') paymentReference?: string,
  ) {
    return this.payrollService.markPaid(id, user.tenantId, paymentMethod, paymentReference);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.payrollService.remove(id, user.tenantId);
  }
}
