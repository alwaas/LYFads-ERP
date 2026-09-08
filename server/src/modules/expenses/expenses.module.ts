import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { GlModule } from '../gl/gl.module';

import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [PrismaModule, GlModule, ActivityLogsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
