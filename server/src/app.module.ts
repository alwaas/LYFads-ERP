import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantStatusGuard } from './modules/auth/guards/tenant-status.guard';
import { HealthModule } from './modules/health/health.module';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
// import { TasksService } from './modules/tasks/tasks.service';
// import { TasksController } from './modules/tasks/tasks.controller';
import { TasksModule } from './modules/tasks/tasks.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { DailyWorkReportsModule } from './modules/daily-work-reports';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CrmModule } from './/modules/crm/crm.module';
import { ProjectTimelineModule } from './modules/project-timeline/project-timeline.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { InvoiceItemsModule } from './modules/invoice-items/invoice-items.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { ProductsModule } from './modules/products/products.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module';
import { StockCountsModule } from './modules/stock-counts/stock-counts.module';
import { InventoryValuationModule } from './modules/inventory-valuation/inventory-valuation.module';
import { LeaveBalancesModule } from './modules/leave-balances/leave-balances.module';
import { SalaryStructuresModule } from './modules/salary-structures/salary-structures.module';
import { PayrollItemsModule } from './modules/payroll-items/payroll-items.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { PaymentAllocationsModule } from './modules/payment-allocations/payment-allocations.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { PurchaseInvoicesModule } from './modules/purchase-invoices/purchase-invoices.module';
import { GlModule } from './modules/gl/gl.module';
import { TenantManagementModule } from './modules/tenant-management/tenant-management.module';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ThrottlerModule.forRoot({
      throttlers: [
        { limit: 100, ttl: 60000 },
        { limit: 5, ttl: 60000, name: 'auth' },
      ],
      ignoreUserAgents: [/swagger/i],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
    AttendanceModule,
    LeavesModule,
    NotificationsModule,
    UploadsModule,
    ActivityLogsModule,
    DailyWorkReportsModule,
    MilestonesModule,
    CommentsModule,
    AttachmentsModule,
    ReportsModule,
    CrmModule,
    ProjectTimelineModule,
    KanbanModule,
    TimesheetsModule,
    PayrollModule,
    InvoiceModule,
    InvoiceItemsModule,
    PaymentsModule,
    SettingsModule,
    ExpensesModule,
    PurchasesModule,
    VendorsModule,
    ProductsModule,
    WarehousesModule,
    StockMovementsModule,
    StockCountsModule,
    InventoryValuationModule,
    LeaveBalancesModule,
    SalaryStructuresModule,
    PayrollItemsModule,
    SalesOrdersModule,
    PaymentAllocationsModule,
    PurchaseOrdersModule,
    PurchaseInvoicesModule,
    GlModule,
    TenantManagementModule,
    PlansModule,
    SubscriptionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantStatusGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
