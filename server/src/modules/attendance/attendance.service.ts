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

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(dto: CreateAttendanceDto, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    // Verify employee belongs to the same tenant
    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId: dto.employeeId,
        tenantId: userTenantId,
        date: {
          gte: today,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already checked in today.');
    }

    return this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: new Date(),
        checkIn: new Date(),
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

  async checkOut(employeeId: string, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    // Verify employee belongs to the same tenant
    if (employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        tenantId: userTenantId,
        date: {
          gte: today,
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Check-in not found for today.');
    }

    if (attendance.checkOut) {
      throw new ConflictException('Already checked out today.');
    }

    const attendanceRecord = await this.prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOut: new Date(),
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

    return attendanceRecord;
  }

  async todayAttendance(userTenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.attendance.findMany({
      where: {
        tenantId: userTenantId,
        date: {
          gte: today,
        },
      },
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
      orderBy: {
        checkIn: 'asc',
      },
    });
  }

  async attendanceHistory(query: AttendanceHistoryDto, userTenantId: string) {
    const { skip, limit } = query;

    const where: Prisma.AttendanceWhereInput = query.search
      ? {
          tenantId: userTenantId,
          employee: {
            user: {
              fullName: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {
          tenantId: userTenantId,
        };

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
        orderBy: {
          date: 'desc',
        },
      }),
      this.prisma.attendance.count({
        where,
      }),
    ]);

    return {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      data,
    };
  }
}
