import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  private async resolveEmployeeFromUser(
    userTenantId: string,
    userId: string,
  ): Promise<{ id: string; tenantId: string }> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true, tenantId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for this user.');
    }

    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    return employee;
  }

  private buildEmployeeInclude(role: UserRole) {
    const baseInclude = {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    };

    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.MANAGER) {
      return {
        ...baseInclude,
      };
    }

    return baseInclude;
  }

  private sanitizeEmployeeData(employee: any, role: UserRole) {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.MANAGER) {
      return employee;
    }

    const { salary, bankName, bankAccountNumber, ifscCode, ...rest } = employee;
    return rest;
  }

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

    const existingEmployee = await this.prisma.employee.findFirst({
      where: {
        employeeCode: dto.employeeCode,
        tenantId: userTenantId,
      },
    });

    if (existingEmployee) {
      throw new ConflictException(
        'Employee code already exists in this tenant.',
      );
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

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string, userRole?: UserRole) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (search.search) {
      where.OR = [
        { fullName: { contains: search.search, mode: 'insensitive' } },
        { email: { contains: search.search, mode: 'insensitive' } },
        { employeeCode: { contains: search.search, mode: 'insensitive' } },
        { department: { contains: search.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
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

      this.prisma.employee.count({ where }),
    ]);

    const sanitizedData = userRole
      ? data.map((employee) => this.sanitizeEmployeeData(employee, userRole))
      : data;

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data: sanitizedData,
    };
  }

  async findOne(id: string, userTenantId: string, userRole?: UserRole) {
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

    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    return userRole ? this.sanitizeEmployeeData(employee, userRole) : employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, userTenantId: string) {
    const employee = await this.findOne(id, userTenantId);

    if (dto.employeeCode && dto.employeeCode !== employee.employeeCode) {
      const existingEmployee = await this.prisma.employee.findFirst({
        where: {
          employeeCode: dto.employeeCode,
          tenantId: userTenantId,
          id: { not: id },
        },
        select: { id: true },
      });

      if (existingEmployee) {
        throw new ConflictException(
          'Employee code already exists in this tenant.',
        );
      }
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: {
        employeeCode: dto.employeeCode,
        phone: dto.phone,
        designation: dto.designation,
        department: dto.department,
        status: dto.status,
        managerId: dto.managerId,
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        ifscCode: dto.ifscCode,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
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

  async updateSelfProfile(user: AuthenticatedUser, dto: UpdateEmployeeDto) {
    const { id: employeeId, tenantId } = await this.resolveEmployeeFromUser(
      user.tenantId,
      user.userId,
    );

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
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
      throw new NotFoundException('Employee profile not found.');
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        phone: dto.phone,
        designation: dto.designation,
        department: dto.department,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pincode: dto.pincode,
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        ifscCode: dto.ifscCode,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
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
      description: 'Employee self-profile updated.',
      userId: employee.userId,
      tenantId,
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
