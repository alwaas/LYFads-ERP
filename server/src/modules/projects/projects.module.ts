import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
