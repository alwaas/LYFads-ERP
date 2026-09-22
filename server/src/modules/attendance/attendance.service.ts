import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceHistoryDto } from './dto/attendance-history.dto';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveEmployeeFromUser(
    user: AuthenticatedUser,
  ): Promise<{ id: string; tenantId: string }> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId: user.userId },
      select: { id: true, tenantId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for this user.');
    }

    if (employee.tenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    return employee;
  }

  private async buildAttendanceWhere(
    tenantId: string,
    user: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = { tenantId };

    if (user.role === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });

      const employeeId = employee?.id;
      if (employeeId) {
        where.employeeId = employeeId;
      }
    }

    return where;
  }

  async checkIn(dto: CreateAttendanceDto, userTenantId: string) {
    const employeeId = dto.employeeId;

    if (!employeeId) {
      throw new ForbiddenException('employeeId is required for admin/manager check-in.');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const attendanceDate = dto.date ? new Date(dto.date) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        tenantId: userTenantId,
        date: { gte: today },
      },
    });

    if (existing) {
      throw new ConflictException('Already checked in today.');
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date: attendanceDate,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : new Date(),
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        status: dto.status,
        remarks: dto.remarks,
        tenantId: userTenantId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async checkInSelf(user: AuthenticatedUser) {
    const { id: employeeId, tenantId } = await this.resolveEmployeeFromUser(user);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        tenantId,
        date: { gte: today },
      },
    });

    if (existing) {
      throw new ConflictException('Already checked in today.');
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(),
        checkIn: new Date(),
        tenantId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async checkOut(employeeId: string, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        tenantId: userTenantId,
        date: { gte: today },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Check-in not found for today.');
    }

    if (attendance.checkOut) {
      throw new ConflictException('Already checked out today.');
    }

    const attendanceRecord = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
      include: {
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return attendanceRecord;
  }

  async checkOutSelf(user: AuthenticatedUser) {
    const { id: employeeId, tenantId } = await this.resolveEmployeeFromUser(user);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        tenantId,
        date: { gte: today },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Check-in not found for today.');
    }

    if (attendance.checkOut) {
      throw new ConflictException('Already checked out today.');
    }

    const attendanceRecord = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
      include: {
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return attendanceRecord;
  }

  async getMyStatus(user: AuthenticatedUser) {
    const { id: employeeId, tenantId } = await this.resolveEmployeeFromUser(user);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        tenantId,
        date: { gte: today },
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!attendance) {
      return {
        checkedIn: false,
        checkedOut: false,
        attendanceId: null,
        checkIn: null,
        checkOut: null,
        status: null,
        date: today.toISOString(),
      };
    }

    return {
      checkedIn: !!attendance.checkIn,
      checkedOut: !!attendance.checkOut,
      attendanceId: attendance.id,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      status: attendance.status,
      date: attendance.date,
    };
  }

  async todayAttendance(tenantId: string, user: AuthenticatedUser) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = await this.buildAttendanceWhere(tenantId, user);
    (where as Record<string, unknown>).date = { gte: today };

    return this.prisma.attendance.findMany({
      where,
      include: {
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
      orderBy: { checkIn: 'asc' },
    });
  }

  async attendanceHistory(query: AttendanceHistoryDto, tenantId: string, user: AuthenticatedUser) {
    const { skip, limit } = query;

    const where = await this.buildAttendanceWhere(tenantId, user);

    if (query.search) {
      where.employee = {
        user: {
          fullName: {
            contains: query.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate) {
      where.date = { ...(where.date as Record<string, unknown> || {}), gte: new Date(query.fromDate) };
    }

    if (query.toDate) {
      where.date = { ...(where.date as Record<string, unknown> || {}), lte: new Date(`${query.toDate}T23:59:59`) };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        include: {
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
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      data,
    };
  }

  async findOne(id: string, userTenantId: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
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

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    if (attendance.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this attendance record');
    }

    return attendance;
  }
}
