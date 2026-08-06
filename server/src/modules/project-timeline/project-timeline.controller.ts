import { Controller, Get, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectTimelineService } from './project-timeline.service';

@Controller('project-timeline')
export class ProjectTimelineController {
  constructor(
    private readonly service: ProjectTimelineService,
  ) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get(':projectId')
  getTimeline(@Param('projectId') projectId: string) {
    return this.service.getTimeline(projectId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
  )
  @Get('deadlines/upcoming')
  upcomingDeadlines() {
    return this.service.getUpcomingDeadlines();
  }
}
