import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

import { PrismaService } from '../../database';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userTenantId: string) {
    const [
      users,
      employees,
      activeEmployees,
      inactiveEmployees,
      clients,
      projects,
      activeProjects,
      completedProjects,
      tasks,
      completedTasks,
      pendingTasks,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: { tenantId: userTenantId },
      }),

      this.prisma.employee.count({
        where: { tenantId: userTenantId },
      }),

      this.prisma.user.count({
        where: {
          isActive: true,
          tenantId: userTenantId,
        },
      }),

      this.prisma.user.count({
        where: {
          isActive: false,
          tenantId: userTenantId,
        },
      }),

      this.prisma.client.count({
        where: { tenantId: userTenantId },
      }),

      this.prisma.project.count({
        where: { tenantId: userTenantId },
      }),

      this.prisma.project.count({
        where: {
          status: 'ACTIVE',
          tenantId: userTenantId,
        },
      }),

      this.prisma.project.count({
        where: {
          status: 'COMPLETED',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: { tenantId: userTenantId },
      }),

      this.prisma.task.count({
        where: {
          status: TaskStatus.COMPLETED,
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          NOT: {
            status: TaskStatus.COMPLETED,
          },
          tenantId: userTenantId,
        },
      }),
    ]);

    return {
      users,

      employees: {
        total: employees,
        active: activeEmployees,
        inactive: inactiveEmployees,
      },

      clients,

      projects: {
        total: projects,
        active: activeProjects,
        completed: completedProjects,
      },

      tasks: {
        total: tasks,
        completed: completedTasks,
        pending: pendingTasks,
      },
    };
  }

  async getRecentProjects(userTenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId: userTenantId },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getRecentTasks(userTenantId: string) {
    return this.prisma.task.findMany({
      where: { tenantId: userTenantId },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
          },
        },
        employee: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getActivitySummary(userTenantId: string) {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      highPriorityTasks,
      totalEmployees,
      totalClients,
    ] = await this.prisma.$transaction([
      this.prisma.project.count({
        where: { tenantId: userTenantId },
      }),
      this.prisma.project.count({
        where: {
          status: 'ACTIVE',
          tenantId: userTenantId,
        },
      }),
      this.prisma.project.count({
        where: {
          status: 'COMPLETED',
          tenantId: userTenantId,
        },
      }),
      this.prisma.task.count({
        where: { tenantId: userTenantId },
      }),
      this.prisma.task.count({
        where: {
          status: 'COMPLETED',
          tenantId: userTenantId,
        },
      }),
      this.prisma.task.count({
        where: {
          status: 'IN_PROGRESS',
          tenantId: userTenantId,
        },
      }),
      this.prisma.task.count({
        where: {
          status: 'TODO',
          tenantId: userTenantId,
        },
      }),

      // NEW: Overdue Tasks
      this.prisma.task.count({
        where: {
          dueDate: {
            lt: new Date(),
          },
          status: {
            not: 'COMPLETED',
          },
          tenantId: userTenantId,
        },
      }),

      // NEW: High Priority Tasks
      this.prisma.task.count({
        where: {
          priority: 'HIGH',
          tenantId: userTenantId,
        },
      }),

      this.prisma.employee.count({
        where: { tenantId: userTenantId },
      }),

      this.prisma.client.count({
        where: { tenantId: userTenantId },
      }),
    ]);

    const completionRate =
      totalTasks === 0
        ? 0
        : Number(((completedTasks / totalTasks) * 100).toFixed(2));

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },

      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        highPriority: highPriorityTasks,
        completionRate,
      },

      employees: totalEmployees,

      clients: totalClients,
    };
  }

  async getCharts(userTenantId: string) {
    const [
      activeProjects,
      completedProjects,
      todoTasks,
      inProgressTasks,
      completedTasks,
    ] = await this.prisma.$transaction([
      this.prisma.project.count({
        where: {
          status: 'ACTIVE',
          tenantId: userTenantId,
        },
      }),

      this.prisma.project.count({
        where: {
          status: 'COMPLETED',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'TODO',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'IN_PROGRESS',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'COMPLETED',
          tenantId: userTenantId,
        },
      }),
    ]);

    return {
      projectStatus: [
        {
          name: 'Active',
          value: activeProjects,
        },
        {
          name: 'Completed',
          value: completedProjects,
        },
      ],

      taskStatus: [
        {
          name: 'Todo',
          value: todoTasks,
        },
        {
          name: 'In Progress',
          value: inProgressTasks,
        },
        {
          name: 'Completed',
          value: completedTasks,
        },
      ],
    };
  }

  async getRecentActivities(userTenantId: string) {
    return this.prisma.activityLog.findMany({
      where: { tenantId: userTenantId },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getEmployeeWorkload(userTenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId: userTenantId },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        task: {
          select: {
            id: true,
          },
        },
      },
    });

    return employees.map((employee) => ({
      name: employee.user.fullName,
      tasks: employee.task.length,
    }));
  }

  async getPriorityChart(userTenantId: string) {
    const [low, medium, high, urgent] = await this.prisma.$transaction([
      this.prisma.task.count({
        where: {
          priority: 'LOW',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          priority: 'MEDIUM',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          priority: 'HIGH',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          priority: 'URGENT',
          tenantId: userTenantId,
        },
      }),
    ]);

    return [
      {
        name: 'Low',
        value: low,
      },
      {
        name: 'Medium',
        value: medium,
      },
      {
        name: 'High',
        value: high,
      },
      {
        name: 'Urgent',
        value: urgent,
      },
    ];
  }

  async getProjectStatusChart(userTenantId: string) {
    const [active, completed, pending] = await this.prisma.$transaction([
      this.prisma.project.count({
        where: {
          status: 'ACTIVE',
          tenantId: userTenantId,
        },
      }),

      this.prisma.project.count({
        where: {
          status: 'COMPLETED',
          tenantId: userTenantId,
        },
      }),

      this.prisma.project.count({
        where: {
          status: 'PLANNING',
          tenantId: userTenantId,
        },
      }),
    ]);

    return [
      {
        name: 'Active',
        value: active,
      },
      {
        name: 'Completed',
        value: completed,
      },
      {
        name: 'Pending',
        value: pending,
      },
    ];
  }

  async getTaskStatusChart(userTenantId: string) {
    const [todo, progress, completed] = await this.prisma.$transaction([
      this.prisma.task.count({
        where: {
          status: 'TODO',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'IN_PROGRESS',
          tenantId: userTenantId,
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'COMPLETED',
          tenantId: userTenantId,
        },
      }),
    ]);

    return [
      {
        name: 'Todo',
        value: todo,
      },
      {
        name: 'In Progress',
        value: progress,
      },
      {
        name: 'Completed',
        value: completed,
      },
    ];
  }

  async getUpcomingDeadlines(userTenantId: string) {
    return this.prisma.task.findMany({
      where: {
        dueDate: {
          gte: new Date(),
        },
        NOT: {
          status: 'COMPLETED',
        },
        tenantId: userTenantId,
      },

      orderBy: {
        dueDate: 'asc',
      },

      take: 10,

      include: {
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },

        project: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}
