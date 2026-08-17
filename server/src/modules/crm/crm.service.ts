import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

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

  async create(dto: CreateLeadDto, userTenantId: string) {
    // Validate that dto.tenantId (if provided) matches authenticated user's tenant
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException('Cannot create lead for a different tenant');
    }

    if (dto.email) {
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          email: dto.email.toLowerCase(),
          tenantId: userTenantId,
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
        select: {
          id: true,
          tenantId: true,
        },
      });

      if (!employee) {
        throw new NotFoundException('Assigned employee not found.');
      }

      // Validate employee belongs to the same tenant
      if (employee.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot assign lead to employee from different tenant',
        );
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
        tenantId: userTenantId,
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
      tenantId: userTenantId,
    });

    return lead;
  }

  async findAll(query: GetLeadsDto, userTenantId: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      tenantId: userTenantId,
      ...(query.search
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
        : {}),
    };

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

  async findOne(id: string, userTenantId: string) {
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

    // Verify tenant ownership
    if (lead.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this lead');
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    if (dto.assignedToId) {
      const employee = await this.prisma.employee.findUnique({
        where: {
          id: dto.assignedToId,
        },
        select: {
          id: true,
          tenantId: true,
        },
      });

      if (!employee) {
        throw new NotFoundException('Assigned employee not found.');
      }

      // Validate employee belongs to the same tenant
      if (employee.tenantId !== userTenantId) {
        throw new ForbiddenException(
          'Cannot assign lead to employee from different tenant',
        );
      }
    }

    const updatedLead = await this.prisma.lead.update({
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
      description: `Lead "${updatedLead.companyName}" updated successfully.`,
      userId: updatedLead.assignedToId ?? undefined,
      tenantId: userTenantId,
    });

    return updatedLead;
  }

  async remove(id: string, userTenantId: string) {
    const lead = await this.findOne(id, userTenantId);

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
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Lead deleted successfully.',
    };
  }
}
