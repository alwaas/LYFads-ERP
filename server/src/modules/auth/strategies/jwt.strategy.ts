import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../../common/types/auth-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is required but was not provided.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
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
