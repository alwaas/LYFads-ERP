import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
    userTenantId: string,
    requesterRole: UserRole,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const targetTenant = await this.prisma.tenant.findUnique({
      where: { id: createUserDto.tenantId },
      select: { id: true, status: true },
    });

    if (!targetTenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (targetTenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Tenant is not active');
    }

    let tenantId = createUserDto.tenantId;
    let role = createUserDto.role as UserRole;

    if (requesterRole !== UserRole.SUPER_ADMIN) {
      tenantId = userTenantId;
      if (role === UserRole.SUPER_ADMIN) {
        role = UserRole.EMPLOYEE;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: createUserDto.fullName,
        email: createUserDto.email.toLowerCase(),
        password: hashedPassword,
        role,
        tenantId,
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'USER',
      description: `User ${user.email} registered.`,
      userId: user.id,
      tenantId: user.tenantId,
    });

    return {
      success: true,
      message: 'User registered successfully.',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email.toLowerCase(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    await this.activityLogsService.log({
      action: 'LOGIN',
      module: 'AUTH',
      description: `${user.fullName} logged into the system.`,
      userId: user.id,
      tenantId: user.tenantId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
