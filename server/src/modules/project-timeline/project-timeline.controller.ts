import { Controller, Get, Param } from '@nestjs/common';
import { ProjectTimelineService } from './project-timeline.service';

@Controller('project-timeline')
export class ProjectTimelineController {
  constructor(private readonly service: ProjectTimelineService) {}

  @Get(':projectId')
  getTimeline(@Param('projectId') projectId: string) {
    return this.service.getTimeline(projectId);
  }

  @Get('deadlines/upcoming')
  upcomingDeadlines() {
    return this.service.getUpcomingDeadlines();
  }
}
