import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [PrismaModule, AttachmentsModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
