import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';

@Injectable()
export class TimesheetsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTimesheetDto) {
    return this.prisma.timesheet.create({
      data: {
        ...dto,
      },
    });
  }

  findAll() {
    return this.prisma.timesheet.findMany({
      include: {
        employee: true,
        project: true,
        task: true,
      },
      orderBy: {
        workDate: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.timesheet.findUnique({
      where: { id },
      include: {
        employee: true,
        project: true,
        task: true,
      },
    });
  }

  update(id: string, dto: UpdateTimesheetDto) {
    return this.prisma.timesheet.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.timesheet.delete({
      where: { id },
    });
  }

  employeeSummary(employeeId: string) {
    return this.prisma.timesheet.aggregate({
      where: {
        employeeId,
      },
      _sum: {
        hours: true,
      },
      _count: true,
    });
  }

  projectSummary(projectId: string) {
    return this.prisma.timesheet.aggregate({
      where: {
        projectId,
      },
      _sum: {
        hours: true,
      },
      _count: true,
    });
  }
}
