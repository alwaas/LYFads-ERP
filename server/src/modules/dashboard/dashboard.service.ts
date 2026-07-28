import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

import { PrismaService } from '../../database';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
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
      this.prisma.user.count(),

      this.prisma.employee.count(),

      this.prisma.user.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.user.count({
        where: {
          isActive: false,
        },
      }),

      this.prisma.client.count(),

      this.prisma.project.count(),

      this.prisma.project.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      this.prisma.project.count({
        where: {
          status: 'COMPLETED',
        },
      }),

      this.prisma.task.count(),

      this.prisma.task.count({
        where: {
          status: TaskStatus.COMPLETED,
        },
      }),

      this.prisma.task.count({
        where: {
          NOT: {
            status: TaskStatus.COMPLETED,
          },
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

  async getRecentProjects() {
    return this.prisma.project.findMany({
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

  async getRecentTasks() {
    return this.prisma.task.findMany({
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

  async getActivitySummary() {
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
        this.prisma.project.count(),
        this.prisma.project.count({
        where: {
            status: 'ACTIVE',
        },
        }),
        this.prisma.project.count({
        where: {
            status: 'COMPLETED',
        },
        }),
        this.prisma.task.count(),
        this.prisma.task.count({
        where: {
            status: 'COMPLETED',
        },
        }),
        this.prisma.task.count({
        where: {
            status: 'IN_PROGRESS',
        },
        }),
        this.prisma.task.count({
        where: {
          status: 'TODO',
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
        },
      }),

      // NEW: High Priority Tasks
      this.prisma.task.count({
        where: {
          priority: 'HIGH',
        },
      }),

      this.prisma.employee.count(),

      this.prisma.client.count(),
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

    async getCharts() {
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
        },
      }),

      this.prisma.project.count({
        where: {
          status: 'COMPLETED',
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'TODO',
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'IN_PROGRESS',
        },
      }),

      this.prisma.task.count({
        where: {
          status: 'COMPLETED',
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

  async getRecentActivities() {
    return this.prisma.activityLog.findMany({
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
}
