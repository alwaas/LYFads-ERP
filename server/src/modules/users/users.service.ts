import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import * as bcrypt from 'bcrypt';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (search.search) {
      where.OR = [
        { fullName: { contains: search.search, mode: 'insensitive' } },
        { email: { contains: search.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
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
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
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

    if (user.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this user');
    }

    return user;
  }

  async create(dto: CreateUserDto, userTenantId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ForbiddenException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        role: dto.role,
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
    });

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

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
