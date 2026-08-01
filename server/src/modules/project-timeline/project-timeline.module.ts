import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';

import { ProjectTimelineController } from './project-timeline.controller';
import { ProjectTimelineService } from './project-timeline.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectTimelineController],
  providers: [ProjectTimelineService],
})
export class ProjectTimelineModule {}