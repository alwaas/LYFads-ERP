import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SearchDto } from '../../common/dto/search.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: dto.email.toLowerCase(),
        },
      });

      if (existingUser) {
        throw new ConflictException("Email already exists.");
      }

      const existingEmployee = await this.prisma.employee.findUnique({
        where: {
          employeeCode: dto.employeeCode,
        },
      });

      if (existingEmployee) {
        throw new ConflictException("Employee code already exists.");
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12);

      const employee = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            fullName: dto.fullName,
            email: dto.email.toLowerCase(),
            password: hashedPassword,
            role: dto.role,
          },
        });

        return await tx.employee.create({
          data: {
            employeeCode: dto.employeeCode,
            phone: dto.phone,
            designation: dto.designation,
            department: dto.department,
            userId: user.id,
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        });
      });

      // Temporarily disable activity log to verify create works.
      // Uncomment after fixing ActivityLogsService.
      /*
      await this.activityLogsService.log({
        action: "CREATE",
        module: "EMPLOYEE",
        description: `Employee ${employee.employeeCode} created successfully.`,
        userId: employee.userId,
      });
      */

      return employee;
    } catch (error) {
      console.error("========== CREATE EMPLOYEE ERROR ==========");
      console.error(error);
      throw error;
    }
  }

  async findAll(pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.employee.count(),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    return employee;
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
  ) {
    await this.findOne(id);

    const employee = await this.prisma.employee.update({
      where: {
        id,
      },
      data: {
        employeeCode: dto.employeeCode,
        phone: dto.phone,
        designation: dto.designation,
        department: dto.department,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'EMPLOYEE',
      description: `Employee ${employee.employeeCode} updated successfully.`,
      userId: employee.userId,
    });

    return employee;
  }

  async remove(id: string) {
    const employee = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.delete({
        where: {
          id,
        },
      });

      await tx.user.delete({
        where: {
          id: employee.user.id,
        },
      });
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'EMPLOYEE',
      description: `Employee ${employee.employeeCode} deleted successfully.`,
      userId: employee.user.id,
    });

    return {
      success: true,
      message: 'Employee deleted successfully.',
    };
  }
}
