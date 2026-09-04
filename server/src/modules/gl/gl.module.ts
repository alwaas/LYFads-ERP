import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { GlService } from './gl.service';
import { GlController } from './gl.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GlController],
  providers: [GlService],
  exports: [GlService],
})
export class GlModule {}
