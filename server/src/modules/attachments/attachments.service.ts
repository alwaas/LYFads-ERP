import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAttachmentDto) {
    return this.prisma.attachment.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.attachment.findMany({
      include: {
        user: true,
        project: true,
        task: true,
        milestone: true,
        comment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.attachment.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        task: true,
        milestone: true,
        comment: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.attachment.delete({
      where: { id },
    });
  }
}
