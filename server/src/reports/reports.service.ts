import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [employees, clients, projects, tasks, leads, attendance, leaves] =
      await Promise.all([
        this.prisma.employee.count(),
        this.prisma.client.count(),
        this.prisma.project.count(),
        this.prisma.task.count(),
        this.prisma.lead.count(),
        this.prisma.attendance.count(),
        this.prisma.leave.count(),
      ]);

    return {
      employees,
      clients,
      projects,
      tasks,
      leads,
      attendance,
      leaves,
    };
  }
}
