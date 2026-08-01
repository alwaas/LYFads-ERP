import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class KanbanService {
  constructor(private prisma: PrismaService) {}

  getBoard(projectId: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
      },
      orderBy: [
        {
          status: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });
  }

  moveTask(taskId: string, dto: MoveTaskDto) {
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: dto.status,
      },
    });
  }

  statistics(projectId: string) {
    return this.prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId,
      },
      _count: {
        status: true,
      },
    });
  }
}