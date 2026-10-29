import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@tunefour/auth';
import { Request } from 'express';

/**
 * Inject the authenticated user into a route handler parameter. The global
 * JwtAuthGuard attaches the user to the request after validating the access
 * token, so any guarded handler can receive it directly.
 *
 * @example
 *   @Get('me')
 *   me(@CurrentUser() user: AuthenticatedUser) { return user; }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as Request & { user?: AuthenticatedUser }).user;
  },
);
