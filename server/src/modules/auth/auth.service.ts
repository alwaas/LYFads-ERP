import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async register(createUserDto: CreateUserDto, userTenantId?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Use provided tenantId from authenticated context, otherwise use dto.tenantId
    // For SUPER_ADMIN, they can specify tenantId. For normal users, use their tenant.
    const tenantId = userTenantId || createUserDto.tenantId;

    if (!tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: createUserDto.fullName,
        email: createUserDto.email.toLowerCase(),
        password: hashedPassword,
        role: createUserDto.role,
        tenantId,
      },
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
