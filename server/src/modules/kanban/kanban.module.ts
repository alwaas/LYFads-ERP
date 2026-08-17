import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [KanbanController],
  providers: [KanbanService],
  exports: [KanbanService],
})
export class KanbanModule {}
