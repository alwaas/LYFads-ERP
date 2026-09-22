import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
