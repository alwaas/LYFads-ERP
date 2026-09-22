import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('register')
  register(
    @Body() createUserDto: CreateUserDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.authService.register(createUserDto, user.tenantId, user.role);
  }

@Public()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Get('admin')
  admin() {
    return {
      success: true,
      message: 'Welcome Super Admin!',
    };
  }
}
