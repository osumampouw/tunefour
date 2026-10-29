import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticatedUser,
  AuthorizationRequest,
  AuthProvider,
  CallbackInput,
} from '@tunefour/auth';
import { Role } from '@tunefour/shared-types';
import { AuthService } from './auth.service';
import { AuthTokensService } from './tokens/auth-tokens.service';

const CONFIG: Record<string, string> = {
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
};

function fakeConfig(): ConfigService {
  return {
    getOrThrow: (key: string) => CONFIG[key],
    get: (key: string, fallback?: string) => CONFIG[key] ?? fallback,
  } as unknown as ConfigService;
}

const authUser: AuthenticatedUser = {
  userId: 'user-1',
  email: 'alice@cermati.com',
  role: Role.OfficeManager,
  officeId: 'office-1',
};

const authRequest: AuthorizationRequest = {
  url: 'https://accounts.google.com/o/oauth2/v2/auth?state=S',
  state: 'S',
  nonce: 'N',
  codeVerifier: 'V',
};

/** A provider whose callback resolves to `result` and records its last input. */
function fakeProvider(result: AuthenticatedUser | null): AuthProvider & {
  lastCallback?: CallbackInput;
} {
  const provider = {
    name: 'fake',
    createAuthorizationRequest: () => Promise.resolve(authRequest),
    completeSignIn(input: CallbackInput) {
      provider.lastCallback = input;
      return Promise.resolve(result);
    },
    lastCallback: undefined as CallbackInput | undefined,
  };
  return provider;
}

function makeService(provider: AuthProvider): AuthService {
  const config = fakeConfig();
  const jwt = new JwtService();
  const tokens = new AuthTokensService(jwt, config);
  return new AuthService(provider, tokens, jwt, config);
}

describe('AuthService.beginSignIn', () => {
  it('returns the provider redirect URL and a stashable transaction token', async () => {
    const service = makeService(fakeProvider(authUser));

    const start = await service.beginSignIn();

    expect(start.redirectUrl).toBe(authRequest.url);
    expect(start.transactionToken).toBeTruthy();
  });
});

describe('AuthService.completeSignIn', () => {
  it('issues session tokens when state matches and provisioning succeeds', async () => {
    const provider = fakeProvider(authUser);
    const service = makeService(provider);
    const { transactionToken } = await service.beginSignIn();

    const session = await service.completeSignIn({
      code: 'auth-code',
      state: 'S',
      transactionToken,
    });

    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    // The stashed PKCE verifier and nonce are handed to the provider.
    expect(provider.lastCallback).toEqual({
      code: 'auth-code',
      codeVerifier: 'V',
      expectedNonce: 'N',
    });
  });

  it('rejects when the returned state does not match the transaction (CSRF)', async () => {
    const service = makeService(fakeProvider(authUser));
    const { transactionToken } = await service.beginSignIn();

    await expect(
      service.completeSignIn({
        code: 'auth-code',
        state: 'WRONG',
        transactionToken,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the transaction token is missing', async () => {
    const service = makeService(fakeProvider(authUser));
    await expect(
      service.completeSignIn({
        code: 'auth-code',
        state: 'S',
        transactionToken: undefined,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when provisioning denies (provider returns null)', async () => {
    const service = makeService(fakeProvider(null));
    const { transactionToken } = await service.beginSignIn();

    await expect(
      service.completeSignIn({ code: 'auth-code', state: 'S', transactionToken }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

describe('AuthService.refresh', () => {
  it('rejects when the refresh token is missing', () => {
    const service = makeService(fakeProvider(authUser));
    expect(() => service.refresh(undefined)).toThrow(UnauthorizedException);
  });
});
