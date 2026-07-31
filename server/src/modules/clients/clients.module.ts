import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
