import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMilestoneDto) {
    return this.prisma.milestone.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.milestone.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.milestone.findUnique({
      where: { id },
    });
  }

  update(id: string, dto: UpdateMilestoneDto) {
    return this.prisma.milestone.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.milestone.delete({
      where: { id },
    });
  }
}
