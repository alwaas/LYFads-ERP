import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksService } from './modules/tasks/tasks.service';
import { TasksController } from './modules/tasks/tasks.controller';
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
    TasksService,
  ],
  controllers: [TasksController],
})
export class AppModule {}
