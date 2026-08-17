import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userTenantId: string) {
    const [employees, clients, projects, tasks, leads, attendance, leaves] =
      await Promise.all([
        this.prisma.employee.count({
          where: { tenantId: userTenantId },
        }),
        this.prisma.client.count({
          where: { tenantId: userTenantId },
        }),
        this.prisma.project.count({
          where: { tenantId: userTenantId },
        }),
        this.prisma.task.count({
          where: { tenantId: userTenantId },
        }),
        this.prisma.lead.count({
          where: { tenantId: userTenantId },
        }),
        this.prisma.attendance.count({
          where: { tenantId: userTenantId },
        }),
        this.prisma.leave.count({
          where: { tenantId: userTenantId },
        }),
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
