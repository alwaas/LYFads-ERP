import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

@Module({
  imports: [
    PrismaModule,
    ActivityLogsModule,
  ],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}