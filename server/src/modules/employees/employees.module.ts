import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [PrismaModule, ActivityLogsModule, ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
