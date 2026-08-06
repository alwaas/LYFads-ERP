import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { GetLeadsDto } from './dto/get-leads.dto';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateLeadDto) {
    if (dto.email) {
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          email: dto.email.toLowerCase(),
        },
      });

      if (existingLead) {
        throw new ConflictException('Lead already exists.');
      }
    }

    if (dto.assignedToId) {
      const employee = await this.prisma.employee.findUnique({
        where: {
          id: dto.assignedToId,
        },
      });

      if (!employee) {
        throw new NotFoundException('Assigned employee not found.');
      }
    }

    const lead = await this.prisma.lead.create({
      data: {
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        status: dto.status,
        source: dto.source,
        estimatedValue: dto.estimatedValue,
        remarks: dto.remarks,
        assignedToId: dto.assignedToId,
      },
      include: {
        assignedTo: true,
        followUps: true,
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'CRM',
      description: `Lead "${lead.companyName}" created successfully.`,
      userId: lead.assignedToId ?? undefined,
    });

    return lead;
  }

  async findAll(query: GetLeadsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = query.search
      ? {
          OR: [
            {
              companyName: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              contactPerson: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              email: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignedTo: true,
          followUps: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.lead.count({
        where,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: {
        id,
      },
      include: {
        assignedTo: true,
        followUps: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found.');
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);

    if (dto.assignedToId) {
      const employee = await this.prisma.employee.findUnique({
        where: {
          id: dto.assignedToId,
        },
      });

      if (!employee) {
        throw new NotFoundException('Assigned employee not found.');
      }
    }

    const lead = await this.prisma.lead.update({
      where: {
        id,
      },
      data: {
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        status: dto.status,
        source: dto.source,
        estimatedValue: dto.estimatedValue,
        remarks: dto.remarks,
        assignedToId: dto.assignedToId,
      },
      include: {
        assignedTo: true,
        followUps: true,
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'CRM',
      description: `Lead "${lead.companyName}" updated successfully.`,
      userId: lead.assignedToId ?? undefined,
    });

    return lead;
  }

  async remove(id: string) {
    const lead = await this.findOne(id);

    await this.prisma.lead.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'CRM',
      description: `Lead "${lead.companyName}" deleted successfully.`,
      userId: lead.assignedToId ?? undefined,
    });

    return {
      success: true,
      message: 'Lead deleted successfully.',
    };
  }
}
