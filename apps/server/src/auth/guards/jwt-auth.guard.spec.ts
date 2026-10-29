import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '@tunefour/auth';
import { Role } from '@tunefour/shared-types';
import { AuthTokensService } from '../tokens/auth-tokens.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const user: AuthenticatedUser = {
  userId: 'u1',
  email: 'a@cermati.com',
  role: Role.Viewer,
  officeId: null,
};

interface FakeRequest {
  headers: { authorization?: string };
  cookies?: Record<string, string>;
  user?: AuthenticatedUser;
}

function context(request: FakeRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function reflectorPublic(isPublic: boolean): Reflector {
  return { getAllAndOverride: () => isPublic } as unknown as Reflector;
}

/** A tokens service that returns `user` for a known-good token and throws otherwise. */
function fakeTokens(): AuthTokensService {
  return {
    verifyAccessToken: (token: string) => {
      if (token === 'good-token') return user;
      throw new UnauthorizedException('Invalid or expired token');
    },
  } as unknown as AuthTokensService;
}

describe('JwtAuthGuard', () => {
  it('lets public routes through without a token', () => {
    const guard = new JwtAuthGuard(reflectorPublic(true), fakeTokens());
    expect(guard.canActivate(context({ headers: {} }))).toBe(true);
  });

  it('authenticates via the Bearer header and attaches the user', () => {
    const guard = new JwtAuthGuard(reflectorPublic(false), fakeTokens());
    const request: FakeRequest = {
      headers: { authorization: 'Bearer good-token' },
    };

    expect(guard.canActivate(context(request))).toBe(true);
    expect(request.user).toEqual(user);
  });

  it('falls back to the access cookie when no header is present', () => {
    const guard = new JwtAuthGuard(reflectorPublic(false), fakeTokens());
    const request: FakeRequest = {
      headers: {},
      cookies: { tf_access: 'good-token' },
    };

    expect(guard.canActivate(context(request))).toBe(true);
    expect(request.user).toEqual(user);
  });

  it('rejects when no token is supplied', () => {
    const guard = new JwtAuthGuard(reflectorPublic(false), fakeTokens());
    expect(() => guard.canActivate(context({ headers: {} }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid token', () => {
    const guard = new JwtAuthGuard(reflectorPublic(false), fakeTokens());
    const request: FakeRequest = {
      headers: { authorization: 'Bearer bad-token' },
    };
    expect(() => guard.canActivate(context(request))).toThrow(
      UnauthorizedException,
    );
  });
});
