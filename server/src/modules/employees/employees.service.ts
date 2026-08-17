import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database';
import { PaginationDto } from '../../common/dto/pagination.dto';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateEmployeeDto, userTenantId: string) {
    // Validate that dto.tenantId (if provided) matches authenticated user's tenant
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create employee for a different tenant',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const existingEmployee = await this.prisma.employee.findUnique({
      where: {
        employeeCode: dto.employeeCode,
      },
    });

    if (existingEmployee) {
      throw new ConflictException('Employee code already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const employee = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          role: dto.role,
          tenantId: userTenantId,
        },
      });

      return tx.employee.create({
        data: {
          employeeCode: dto.employeeCode,
          phone: dto.phone,
          designation: dto.designation,
          department: dto.department,
          userId: user.id,
          tenantId: userTenantId,
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

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'EMPLOYEE',
      description: `Employee ${employee.employeeCode} created successfully.`,
      userId: employee.userId,
      tenantId: employee.tenantId,
    });

    return employee;
  }

  async findAll(pagination: PaginationDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where: {
          tenantId: userTenantId,
        },
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

      this.prisma.employee.count({
        where: {
          tenantId: userTenantId,
        },
      }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async findOne(id: string, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id,
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

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    // Verify tenant ownership
    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, userTenantId: string) {
    const employee = await this.findOne(id, userTenantId);

    const updatedEmployee = await this.prisma.employee.update({
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
      userId: employee.user.id,
      tenantId: userTenantId,
    });

    return updatedEmployee;
  }

  async remove(id: string, userTenantId: string) {
    const employee = await this.findOne(id, userTenantId);

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
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Employee deleted successfully.',
    };
  }
}
