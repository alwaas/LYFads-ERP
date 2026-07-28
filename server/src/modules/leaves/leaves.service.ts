import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaveDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const overlap = await this.prisma.leave.findFirst({
      where: {
        employeeId: dto.employeeId,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            startDate: {
              lte: new Date(dto.endDate),
            },
            endDate: {
              gte: new Date(dto.startDate),
            },
          },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException(
        'Leave request already exists for selected dates.',
      );
    }

    return this.prisma.leave.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        remarks: dto.remarks,
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
    });
  }

  async update(
    id: string,
    dto: UpdateLeaveDto,
  ) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found.', );
    }

    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) < new Date(dto.startDate)
    ) {
      throw new ConflictException(
        'End date cannot be earlier than start date.',
      );
    }

    return this.prisma.leave.update({
      where: {
        id,
      },
      data: {
        ...(dto.leaveType && {
          leaveType: dto.leaveType,
        }),

        ...(dto.startDate && {
          startDate: new Date(dto.startDate),
        }),

        ...(dto.endDate && {
          endDate: new Date(dto.endDate),
        }),

        ...(dto.reason !== undefined && {
          reason: dto.reason,
        }),

        ...(dto.remarks !== undefined && {
          remarks: dto.remarks,
        }),
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
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateLeaveStatusDto,
    ) {
    const leave = await this.prisma.leave.findUnique({
        where: {
        id,
        },
    });

    if (!leave) {
        throw new NotFoundException('Leave request not found.');
    }

    return this.prisma.leave.update({
        where: {
        id,
        },
        data: {
        status: dto.status,
        remarks: dto.remarks ?? leave.remarks,
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
    });
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    ) {
    const { skip, limit } = pagination;

    const where: Prisma.LeaveWhereInput = search.search
        ? {
            OR: [
            {
                reason: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
                },
            },
            {
                employee: {
                user: {
                    fullName: {
                    contains: search.search,
                    mode: Prisma.QueryMode.insensitive,
                    },
                },
                },
            },
            ],
        }
        : {};

    const [data, total] = await this.prisma.$transaction([
        this.prisma.leave.findMany({
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
            createdAt: 'desc',
        },
        }),
        this.prisma.leave.count({
        where,
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

  async findOne(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
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
    });

    if (!leave) {
      throw new NotFoundException(
        "Leave request not found.",
      );
    }

    return leave;
  }
  
}
