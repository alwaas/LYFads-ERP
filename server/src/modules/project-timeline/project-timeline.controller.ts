import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { ProjectTimelineService } from './project-timeline.service';

@Controller('project-timeline')
@UseGuards(JwtAuthGuard)
export class ProjectTimelineController {
  constructor(private readonly service: ProjectTimelineService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get(':projectId')
  getTimeline(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getTimeline(projectId, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Get('deadlines/upcoming')
  upcomingDeadlines(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getUpcomingDeadlines(user.tenantId);
  }
}
