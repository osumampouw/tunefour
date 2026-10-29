import { Role } from '@tunefour/shared-types';
import {
  CallbackInput,
  OidcClient,
  OidcIdentity,
  UserAuthRecord,
  UserAuthStore,
} from './auth-provider.interface';
import { computeCodeChallenge } from './crypto';
import { GoogleOidcAuthProvider } from './google-oidc.provider';
import { ProvisioningConfig } from './provisioning';

const config: ProvisioningConfig = { allowedDomains: ['cermati.com'] };

function makeIdentity(overrides: Partial<OidcIdentity> = {}): OidcIdentity {
  return {
    subject: 'google-sub-123',
    email: 'alice@cermati.com',
    emailVerified: true,
    hostedDomain: 'cermati.com',
    ...overrides,
  };
}

function makeRecord(overrides: Partial<UserAuthRecord> = {}): UserAuthRecord {
  return {
    id: 'user-1',
    email: 'alice@cermati.com',
    role: Role.OfficeManager,
    officeId: 'office-1',
    isActive: true,
    externalId: null,
    ...overrides,
  };
}

/** A fake OIDC client: records the URL inputs and returns a preset identity. */
function fakeClient(identity: OidcIdentity): OidcClient & {
  lastUrlInput?: { state: string; nonce: string; codeChallenge: string };
} {
  const client = {
    buildAuthorizationUrl(input: {
      state: string;
      nonce: string;
      codeChallenge: string;
    }) {
      client.lastUrlInput = input;
      return Promise.resolve(
        `https://accounts.google.com/o/oauth2/v2/auth?state=${input.state}`,
      );
    },
    exchangeCode(_input: CallbackInput): Promise<OidcIdentity> {
      return Promise.resolve(identity);
    },
    lastUrlInput: undefined as
      | { state: string; nonce: string; codeChallenge: string }
      | undefined,
  };
  return client;
}

/** A fake user store backed by a single optional record. */
function fakeStore(record: UserAuthRecord | null): UserAuthStore & {
  linked: Array<{ userId: string; externalId: string }>;
} {
  return {
    linked: [],
    findByEmail(_email: string) {
      return Promise.resolve(record);
    },
    linkExternalId(userId: string, externalId: string) {
      this.linked.push({ userId, externalId });
      return Promise.resolve();
    },
  };
}

const callback: CallbackInput = {
  code: 'auth-code',
  codeVerifier: 'verifier',
  expectedNonce: 'nonce',
};

describe('GoogleOidcAuthProvider.createAuthorizationRequest', () => {
  it('returns a redirect URL and the one-time values to stash', async () => {
    const provider = new GoogleOidcAuthProvider(
      fakeClient(makeIdentity()),
      fakeStore(makeRecord()),
      config,
    );

    const request = await provider.createAuthorizationRequest();

    expect(request.url).toContain('https://accounts.google.com');
    expect(request.state).toBeTruthy();
    expect(request.nonce).toBeTruthy();
    expect(request.codeVerifier).toBeTruthy();
  });

  it('passes the challenge derived from the returned verifier (PKCE binding)', async () => {
    const client = fakeClient(makeIdentity());
    const provider = new GoogleOidcAuthProvider(client, fakeStore(makeRecord()), config);

    const request = await provider.createAuthorizationRequest();

    expect(client.lastUrlInput?.codeChallenge).toBe(
      computeCodeChallenge(request.codeVerifier),
    );
    expect(client.lastUrlInput?.state).toBe(request.state);
    expect(client.lastUrlInput?.nonce).toBe(request.nonce);
  });

  it('mints fresh values on each call', async () => {
    const provider = new GoogleOidcAuthProvider(
      fakeClient(makeIdentity()),
      fakeStore(makeRecord()),
      config,
    );
    const a = await provider.createAuthorizationRequest();
    const b = await provider.createAuthorizationRequest();
    expect(a.state).not.toBe(b.state);
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
  });
});

describe('GoogleOidcAuthProvider.completeSignIn', () => {
  it('returns the normalized identity for an admitted user', async () => {
    const provider = new GoogleOidcAuthProvider(
      fakeClient(makeIdentity()),
      fakeStore(makeRecord()),
      config,
    );

    const user = await provider.completeSignIn(callback);

    expect(user).toEqual({
      userId: 'user-1',
      email: 'alice@cermati.com',
      role: Role.OfficeManager,
      officeId: 'office-1',
    });
  });

  it('captures the provider subject on first sign-in (externalId was null)', async () => {
    const store = fakeStore(makeRecord({ externalId: null }));
    const provider = new GoogleOidcAuthProvider(fakeClient(makeIdentity()), store, config);

    await provider.completeSignIn(callback);

    expect(store.linked).toEqual([{ userId: 'user-1', externalId: 'google-sub-123' }]);
  });

  it('does not re-link when the subject is already captured', async () => {
    const store = fakeStore(makeRecord({ externalId: 'google-sub-123' }));
    const provider = new GoogleOidcAuthProvider(fakeClient(makeIdentity()), store, config);

    await provider.completeSignIn(callback);

    expect(store.linked).toEqual([]);
  });

  it('returns null (not a reason) when provisioning denies — e.g. inactive user', async () => {
    const provider = new GoogleOidcAuthProvider(
      fakeClient(makeIdentity()),
      fakeStore(makeRecord({ isActive: false })),
      config,
    );
    expect(await provider.completeSignIn(callback)).toBeNull();
  });

  it('returns null when the user is not provisioned', async () => {
    const provider = new GoogleOidcAuthProvider(
      fakeClient(makeIdentity()),
      fakeStore(null),
      config,
    );
    expect(await provider.completeSignIn(callback)).toBeNull();
  });

  it('looks the user up by normalized (lower-case) email', async () => {
    const store = fakeStore(makeRecord());
    const spy = jest.spyOn(store, 'findByEmail');
    const provider = new GoogleOidcAuthProvider(
      fakeClient(makeIdentity({ email: 'Alice@Cermati.com' })),
      store,
      config,
    );

    await provider.completeSignIn(callback);

    expect(spy).toHaveBeenCalledWith('alice@cermati.com');
  });
});
