import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { GlModule } from '../gl/gl.module';

import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [PrismaModule, GlModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
