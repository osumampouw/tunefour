import { Role } from '@tunefour/shared-types';
import {
  OidcIdentity,
  UserAuthRecord,
} from './auth-provider.interface';
import {
  decideProvisioning,
  emailDomain,
  ProvisioningConfig,
} from './provisioning';

const config: ProvisioningConfig = { allowedDomains: ['cermati.com'] };

/** A verified Google identity for someone in the allowed domain. */
function identity(overrides: Partial<OidcIdentity> = {}): OidcIdentity {
  return {
    subject: 'google-sub-123',
    email: 'alice@cermati.com',
    emailVerified: true,
    hostedDomain: 'cermati.com',
    ...overrides,
  };
}

/** An active, provisioned user record matching the identity above. */
function record(overrides: Partial<UserAuthRecord> = {}): UserAuthRecord {
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

describe('emailDomain', () => {
  it('returns the lower-case domain', () => {
    expect(emailDomain('Alice@Cermati.COM')).toBe('cermati.com');
  });

  it('returns empty string when there is no @', () => {
    expect(emailDomain('not-an-email')).toBe('');
  });
});

describe('decideProvisioning', () => {
  it('admits an active user in an allowed domain and maps the identity', () => {
    const result = decideProvisioning(identity(), config, record());
    expect(result).toEqual({
      ok: true,
      record: record(),
      user: {
        userId: 'user-1',
        email: 'alice@cermati.com',
        role: Role.OfficeManager,
        officeId: 'office-1',
      },
    });
  });

  it('maps an org-wide user (no office) with officeId null', () => {
    const result = decideProvisioning(
      identity({ email: 'admin@cermati.com' }),
      config,
      record({ email: 'admin@cermati.com', role: Role.SuperAdmin, officeId: null }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.officeId).toBeNull();
  });

  it('denies when the email is not verified', () => {
    const result = decideProvisioning(
      identity({ emailVerified: false }),
      config,
      record(),
    );
    expect(result).toEqual({ ok: false, reason: 'email-unverified' });
  });

  it('denies when the domain is not whitelisted', () => {
    const result = decideProvisioning(
      identity({ email: 'mallory@gmail.com' }),
      config,
      record({ email: 'mallory@gmail.com' }),
    );
    expect(result).toEqual({ ok: false, reason: 'domain-not-allowed' });
  });

  it('denies when no user record exists (no auto-provisioning)', () => {
    const result = decideProvisioning(identity(), config, null);
    expect(result).toEqual({ ok: false, reason: 'no-account' });
  });

  it('denies when the user record is inactive', () => {
    const result = decideProvisioning(
      identity(),
      config,
      record({ isActive: false }),
    );
    expect(result).toEqual({ ok: false, reason: 'inactive' });
  });

  it('fails closed when no domains are allowed', () => {
    const result = decideProvisioning(identity(), { allowedDomains: [] }, record());
    expect(result).toEqual({ ok: false, reason: 'domain-not-allowed' });
  });
});
