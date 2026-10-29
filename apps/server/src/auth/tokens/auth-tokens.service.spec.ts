import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '@tunefour/auth';
import { Role } from '@tunefour/shared-types';
import { AuthTokensService } from './auth-tokens.service';

const CONFIG: Record<string, string> = {
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
};

/** A minimal ConfigService stand-in backed by the CONFIG map above. */
function fakeConfig(overrides: Record<string, string> = {}): ConfigService {
  const values = { ...CONFIG, ...overrides };
  return {
    getOrThrow: (key: string) => {
      if (values[key] === undefined) throw new Error(`missing ${key}`);
      return values[key];
    },
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as unknown as ConfigService;
}

const user: AuthenticatedUser = {
  userId: 'user-1',
  email: 'alice@cermati.com',
  role: Role.OfficeManager,
  officeId: 'office-1',
};

function makeService(config = fakeConfig()): AuthTokensService {
  return new AuthTokensService(new JwtService(), config);
}

describe('AuthTokensService', () => {
  it('issues an access + refresh pair that round-trips back to the identity', () => {
    const service = makeService();

    const { accessToken, refreshToken } = service.issueSession(user);

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(service.verifyAccessToken(accessToken)).toEqual(user);
  });

  it('rejects a tampered or malformed access token', () => {
    const service = makeService();
    expect(() => service.verifyAccessToken('not-a-jwt')).toThrow(
      UnauthorizedException,
    );
  });

  it('does not accept a refresh token as an access token (separate secrets)', () => {
    const service = makeService();
    const { refreshToken } = service.issueSession(user);
    expect(() => service.verifyAccessToken(refreshToken)).toThrow(
      UnauthorizedException,
    );
  });

  it('exchanges a valid refresh token for a new access token', () => {
    const service = makeService();
    const { refreshToken } = service.issueSession(user);

    const { accessToken } = service.refreshAccessToken(refreshToken);

    expect(service.verifyAccessToken(accessToken)).toEqual(user);
  });

  it('rejects refreshing with an access token (wrong secret)', () => {
    const service = makeService();
    const { accessToken } = service.issueSession(user);
    expect(() => service.refreshAccessToken(accessToken)).toThrow(
      UnauthorizedException,
    );
  });

  it('preserves org-wide scope (officeId null) through a token round-trip', () => {
    const service = makeService();
    const orgWide: AuthenticatedUser = { ...user, officeId: null, role: Role.SuperAdmin };

    const { accessToken } = service.issueSession(orgWide);

    expect(service.verifyAccessToken(accessToken)).toEqual(orgWide);
  });
});
