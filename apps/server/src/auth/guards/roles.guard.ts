import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '@tunefour/auth';
import { Role } from '@tunefour/shared-types';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Global guard enforcing the coarse "which roles may call this route" check.
 * Runs after {@link JwtAuthGuard}, so the user is already attached. A route with
 * no `@Roles(...)` is open to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowed || allowed.length === 0) {
      return true; // no role restriction on this route
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
