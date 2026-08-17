import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

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
import { ReportsModule } from './reports/reports.module';
import { CrmModule } from './/modules/crm/crm.module';
import { ProjectTimelineModule } from './modules/project-timeline/project-timeline.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { InvoiceItemsModule } from './modules/invoice-items/invoice-items.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
