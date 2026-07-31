import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        message: dto.message,

        user: {
          connect: {
            id: dto.userId,
          },
        },

        ...(dto.projectId && {
          project: {
            connect: {
              id: dto.projectId,
            },
          },
        }),

        ...(dto.taskId && {
          task: {
            connect: {
              id: dto.taskId,
            },
          },
        }),
      },
    });
  }

  findAll() {
    return this.prisma.comment.findMany({
      include: {
        user: true,
        project: true,
        task: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        task: true,
      },
    });
  }

  update(id: string, dto: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.comment.delete({
      where: { id },
    });
  }
}
