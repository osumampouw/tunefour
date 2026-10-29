import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '@tunefour/auth';
import { Request } from 'express';
import { ACCESS_COOKIE } from '../auth.constants';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthTokensService } from '../tokens/auth-tokens.service';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
  cookies?: Record<string, string>;
};

/**
 * Global guard that authenticates every request by validating the access token,
 * then attaches the resulting {@link AuthenticatedUser} to the request. Routes
 * marked with `@Public()` are let through untouched (e.g. login/callback).
 *
 * The access token is read from the `Authorization: Bearer` header (API
 * clients) or, failing that, the access cookie (the browser portal).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: AuthTokensService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    // Throws UnauthorizedException if the token is invalid or expired.
    request.user = this.tokens.verifyAccessToken(token);
    return true;
  }

  private extractToken(request: RequestWithUser): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }
    return request.cookies?.[ACCESS_COOKIE];
  }
}
