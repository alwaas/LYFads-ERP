import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userTenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId: userTenantId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userTenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Verify tenant ownership
    if (user.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this user');
    }

    return user;
  }

  async updateRole(id: string, dto: UpdateUserRoleDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    return this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    userTenantId: string,
  ) {
    await this.findOne(id, userTenantId);

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }
}
