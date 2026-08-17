import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.EMPLOYEE,
)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getStats(user.tenantId);
  }

  @Get('recent-projects')
  getRecentProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getRecentProjects(user.tenantId);
  }

  @Get('recent-tasks')
  getRecentTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getRecentTasks(user.tenantId);
  }

  @Get('activity-summary')
  getActivitySummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getActivitySummary(user.tenantId);
  }

  @Get('charts')
  getCharts(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getCharts(user.tenantId);
  }

  @Get('employee-workload')
  getEmployeeWorkload(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getEmployeeWorkload(user.tenantId);
  }

  @Get('priority-chart')
  getPriorityChart(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getPriorityChart(user.tenantId);
  }

  @Get('project-status-chart')
  getProjectStatusChart(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getProjectStatusChart(user.tenantId);
  }

  @Get('task-status-chart')
  getTaskStatusChart(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getTaskStatusChart(user.tenantId);
  }

  @Get('upcoming-deadlines')
  getUpcomingDeadlines(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getUpcomingDeadlines(user.tenantId);
  }

  @Get('recent-activities')
  getRecentActivities(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getRecentActivities(user.tenantId);
  }
}
