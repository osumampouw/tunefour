import {
  AuthenticatedUser,
  OidcIdentity,
  UserAuthRecord,
} from './auth-provider.interface';

/** Configuration for the provisioning policy. */
export interface ProvisioningConfig {
  /**
   * Allowed email domains (lower-case, e.g. ['cermati.com']). A sign-in is
   * refused unless the user's email domain is in this list. An empty list
   * denies everyone — the policy fails closed.
   */
  allowedDomains: string[];
}

/** Why a sign-in was refused. Kept internal (for logging) — never shown to the client. */
export type ProvisioningDenyReason =
  | 'email-unverified'
  | 'domain-not-allowed'
  | 'no-account'
  | 'inactive';

/** The outcome of the provisioning policy: admit (with the mapped identity) or deny (with a reason). */
export type ProvisioningResult =
  | { ok: true; user: AuthenticatedUser; record: UserAuthRecord }
  | { ok: false; reason: ProvisioningDenyReason };

/** Extract the lower-case domain part of an email address ('a@B.com' → 'b.com'). */
export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase();
}

/**
 * Decide whether a verified OpenID Connect identity may sign in, and if so map
 * it to our normalized {@link AuthenticatedUser}. This is pure (no I/O): the
 * caller fetches the matching user record and passes it in.
 *
 * Two gates, both required (defense in depth):
 *  1. Domain whitelist — the verified email's domain must be allowed, and the
 *     email must be marked verified by the provider.
 *  2. User allowlist — an active user record must already exist. We never
 *     auto-create accounts; an admin provisions users ahead of time.
 *
 * @param identity the already-verified claims from the OIDC client
 * @param config   the provisioning configuration (allowed domains)
 * @param record   the user record matched by email, or null if none exists
 */
export function decideProvisioning(
  identity: OidcIdentity,
  config: ProvisioningConfig,
  record: UserAuthRecord | null,
): ProvisioningResult {
  if (!identity.emailVerified) {
    return { ok: false, reason: 'email-unverified' };
  }

  if (!config.allowedDomains.includes(emailDomain(identity.email))) {
    return { ok: false, reason: 'domain-not-allowed' };
  }

  if (record === null) {
    return { ok: false, reason: 'no-account' };
  }

  if (!record.isActive) {
    return { ok: false, reason: 'inactive' };
  }

  return {
    ok: true,
    record,
    user: {
      userId: record.id,
      email: record.email,
      role: record.role,
      officeId: record.officeId,
    },
  };
}
