import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.EMPLOYEE,
)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-projects')
  getRecentProjects() {
    return this.dashboardService.getRecentProjects();
  }

  @Get('recent-tasks')
  getRecentTasks() {
    return this.dashboardService.getRecentTasks();
  }

  @Get('activity-summary')
  getActivitySummary() {
    return this.dashboardService.getActivitySummary();
  }

  @Get('charts')
  getCharts() {
    return this.dashboardService.getCharts();
  }

  @Get('recent-activities')
  getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }
}
