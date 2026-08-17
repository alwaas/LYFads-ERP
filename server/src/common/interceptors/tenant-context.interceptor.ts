import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../database';

/**
 * TenantContextInterceptor
 *
 * This interceptor is currently NOT in use.
 * The current architecture uses JWT-based tenant context via JwtStrategy and @CurrentUser decorator.
 *
 * This interceptor was designed to lazily load tenant context from the database,
 * but the JWT approach is more efficient and secure for this application.
 *
 * Retained for potential future use if needed for specific use cases.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user is authenticated, load their tenant context
    if (user && user.userId) {
      this.prisma.user
        .findUnique({
          where: { id: user.userId },
          select: { id: true, tenantId: true, role: true },
        })
        .then((fullUser) => {
          if (!fullUser) {
            throw new BadRequestException('User not found');
          }
          // Attach tenant context to request
          request.user = {
            ...user,
            tenantId: fullUser.tenantId,
            role: fullUser.role,
          };
        })
        .catch((error) => {
          // Log error but don't block request - services will handle missing tenant
          console.error('Failed to load tenant context:', error);
        });
    }

    return next.handle();
  }
}
