import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule, SubscriptionsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
