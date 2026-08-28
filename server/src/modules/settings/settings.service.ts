import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        maxUsers: true,
        maxStorage: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        timezone: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateSettings(tenantId: string, dto: UpdateSettingsDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        maxUsers: true,
        maxStorage: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        timezone: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
