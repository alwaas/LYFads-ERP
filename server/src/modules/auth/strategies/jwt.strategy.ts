import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../../common/types/auth-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'lyfads-super-secret-key-2026',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    tenantId?: string;
    fullName?: string;
  }): Promise<AuthenticatedUser> {
    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      tenantId: payload.tenantId || '',
      fullName: payload.fullName ?? null,
    };
  }
}
