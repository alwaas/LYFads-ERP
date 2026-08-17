import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { ProjectTimelineController } from './project-timeline.controller';
import { ProjectTimelineService } from './project-timeline.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [ProjectTimelineController],
  providers: [ProjectTimelineService],
  exports: [ProjectTimelineService],
})
export class ProjectTimelineModule {}
