import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { GetUser } from '../../modules/auth/decorators/get-user.decorator';
import { ReportsService } from './reports.service';
import {
  DashboardQueryDto,
  ExpenseQueryDto,
  ProfitabilityQueryDto,
  PurchaseQueryDto,
  ReceivablesQueryDto,
  SalesQueryDto,
  VendorQueryDto,
  CustomerQueryDto,
  InventoryQueryDto,
  SalesOrderQueryDto,
  PayablesQueryDto,
  TrialBalanceQueryDto,
  ProfitAndLossQueryDto,
  GeneralLedgerQueryDto,
} from './dto/report-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  dashboard(
    @GetUser() user: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ) {
    return this.reportsService.getDashboard(user.tenantId, query);
  }

  @Get('sales')
  sales(
    @GetUser() user: AuthenticatedUser,
    @Query() query: SalesQueryDto,
  ) {
    return this.reportsService.getSalesReport(user.tenantId, query);
  }

  @Get('receivables')
  receivables(@GetUser() user: AuthenticatedUser) {
    return this.reportsService.getReceivablesReport(user.tenantId);
  }

  @Get('expenses')
  expenses(
    @GetUser() user: AuthenticatedUser,
    @Query() query: ExpenseQueryDto,
  ) {
    return this.reportsService.getExpenseReport(user.tenantId, query);
  }

  @Get('purchases')
  purchases(
    @GetUser() user: AuthenticatedUser,
    @Query() query: PurchaseQueryDto,
  ) {
    return this.reportsService.getPurchaseReport(user.tenantId, query);
  }

  @Get('customers')
  customers(
    @GetUser() user: AuthenticatedUser,
    @Query() query: CustomerQueryDto,
  ) {
    return this.reportsService.getCustomerReport(user.tenantId, query);
  }

  @Get('vendors')
  vendors(
    @GetUser() user: AuthenticatedUser,
    @Query() query: VendorQueryDto,
  ) {
    return this.reportsService.getVendorReport(user.tenantId, query);
  }

  @Get('payables')
  payables(
    @GetUser() user: AuthenticatedUser,
    @Query() query: PayablesQueryDto,
  ) {
    return this.reportsService.getPayablesReport(user.tenantId, query);
  }

  @Get('profitability')
  profitability(
    @GetUser() user: AuthenticatedUser,
    @Query() query: ProfitabilityQueryDto,
  ) {
    return this.reportsService.getProfitabilityReport(user.tenantId, query);
  }

  @Get('inventory')
  inventory(
    @GetUser() user: AuthenticatedUser,
    @Query() query: InventoryQueryDto,
  ) {
    return this.reportsService.getInventoryReport(user.tenantId, query);
  }

  @Get('sales-orders')
  salesOrders(
    @GetUser() user: AuthenticatedUser,
    @Query() query: SalesOrderQueryDto,
  ) {
    return this.reportsService.getSalesOrderReport(user.tenantId, query);
  }

  @Get('employees')
  employees(@GetUser() user: AuthenticatedUser) {
    return this.reportsService.getEmployeeDirectory(user.tenantId);
  }

  @Get('attendance-summary')
  attendanceSummary(
    @GetUser() user: AuthenticatedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getAttendanceSummary(user.tenantId, month, year);
  }

  @Get('leave-report')
  leaveReport(
    @GetUser() user: AuthenticatedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getLeaveReport(user.tenantId, month, year);
  }

  @Get('payroll-summary')
  payrollSummary(
    @GetUser() user: AuthenticatedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getPayrollSummary(user.tenantId, month, year);
  }

  @Get('trial-balance')
  trialBalance(
    @GetUser() user: AuthenticatedUser,
    @Query() query: TrialBalanceQueryDto,
  ) {
    return this.reportsService.getTrialBalanceReport(user.tenantId, query);
  }

  @Get('profit-loss')
  profitLoss(
    @GetUser() user: AuthenticatedUser,
    @Query() query: ProfitAndLossQueryDto,
  ) {
    return this.reportsService.getProfitAndLossReport(user.tenantId, query);
  }

  @Get('general-ledger')
  generalLedger(
    @GetUser() user: AuthenticatedUser,
    @Query() query: GeneralLedgerQueryDto,
  ) {
    return this.reportsService.getGeneralLedgerReport(user.tenantId, query);
  }
}
