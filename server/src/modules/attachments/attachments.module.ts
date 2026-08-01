import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService], // <-- IMPORTANT
})
export class AttachmentsModule {}
