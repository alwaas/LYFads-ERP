import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

const PLAN_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  price: true,
  billingInterval: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  features: true,
  limits: true,
} as const;

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAll() {
    return this.prisma.plan.findMany({
      select: PLAN_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePlanDto, user?: { id?: string; tenantId?: string }) {
    const existing = await this.prisma.plan.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Plan code already exists.');
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        price: dto.price,
        billingInterval: (dto.billingInterval as any) ?? 'MONTHLY',
        isActive: dto.isActive ?? true,
        features: dto.features?.length
          ? {
              create: dto.features.map((f) => ({
                featureCode: f.featureCode,
                description: f.description,
              })),
            }
          : undefined,
        limits: dto.limits?.length
          ? {
              create: dto.limits.map((l) => ({
                resourceCode: l.resourceCode,
                limitValue: l.limitValue,
              })),
            }
          : undefined,
      },
      select: PLAN_SELECT,
    });

    const logData: any = {
      action: 'CREATE',
      module: 'PLAN',
      description: `Plan ${plan.name} (${plan.code}) created.`,
    };
    if (user?.id) {
      logData.userId = user.id;
    }
    if (user?.tenantId) {
      logData.tenantId = user.tenantId;
    }
    if (logData.userId || logData.tenantId) {
      await this.activityLogsService.log(logData);
    }

    return plan;
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      select: PLAN_SELECT,
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async update(id: string, dto: UpdatePlanDto, user?: { id?: string; tenantId?: string }) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (dto.code && dto.code !== plan.code) {
      const existing = await this.prisma.plan.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Plan code already exists.');
      }
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.billingInterval !== undefined && {
          billingInterval: dto.billingInterval as any,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: PLAN_SELECT,
    });

    if (dto.features !== undefined) {
      await this.prisma.planFeature.deleteMany({ where: { planId: id } });
      if (dto.features.length > 0) {
        await this.prisma.planFeature.createMany({
          data: dto.features.map((f) => ({
            planId: id,
            featureCode: f.featureCode,
            description: f.description,
          })),
        });
      }
    }

    if (dto.limits !== undefined) {
      await this.prisma.planLimit.deleteMany({ where: { planId: id } });
      if (dto.limits.length > 0) {
        await this.prisma.planLimit.createMany({
          data: dto.limits.map((l) => ({
            planId: id,
            resourceCode: l.resourceCode,
            limitValue: l.limitValue,
          })),
        });
      }
    }

    const result = await this.prisma.plan.findUnique({
      where: { id },
      select: PLAN_SELECT,
    });

    const logData: any = {
      action: 'UPDATE',
      module: 'PLAN',
      description: `Plan ${updated.name} (${updated.code}) updated.`,
    };
    if (user?.id) {
      logData.userId = user.id;
    }
    if (user?.tenantId) {
      logData.tenantId = user.tenantId;
    }
    if (logData.userId || logData.tenantId) {
      await this.activityLogsService.log(logData);
    }

    return result;
  }
}
