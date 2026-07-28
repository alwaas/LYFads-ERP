import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceHistoryDto } from "./dto/attendance-history.dto";
// import { PaginationDto } from '../../common/dto/pagination.dto';
// import { SearchDto } from '../../common/dto/search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(dto: CreateAttendanceDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId: dto.employeeId,
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

  async checkOut(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
        where: {
        employeeId,
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

    return this.prisma.attendance.update({
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
    }

  async todayAttendance() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.attendance.findMany({
        where: {
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

    async attendanceHistory(
      query: AttendanceHistoryDto,
    ) {
      const { skip, limit } = query;

      const where: Prisma.AttendanceWhereInput =
        query.search
          ? {
              employee: {
                user: {
                  fullName: {
                    contains: query.search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            }
          : {};

      const [data, total] =
        await this.prisma.$transaction([
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
              date: "desc",
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
