import { Role } from '@tunefour/shared-types';

/**
 * The normalized identity every authentication provider must produce. All
 * downstream code — session tokens, guards, role-based access control — works
 * only on this shape, so swapping providers (Google now, Keycloak later) never
 * ripples past the provider itself.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  /** null = all offices (an org-wide role); a value = scoped to that one office. */
  officeId: string | null;
}

/**
 * A provisioned user as the auth layer sees it. This is the access allowlist:
 * a person may sign in only if an active record exists for their email.
 */
export interface UserAuthRecord {
  id: string;
  email: string;
  role: Role;
  officeId: string | null;
  isActive: boolean;
  /** The identity provider's stable account id, once captured; null until first sign-in. */
  externalId: string | null;
}

/**
 * The read/link operations the auth layer needs over users. Kept as an
 * interface so the pure auth package never depends on the server's database;
 * the server supplies a TypeORM-backed implementation.
 */
export interface UserAuthStore {
  /** Look up a provisioned user by (already-normalized, lower-case) email. */
  findByEmail(email: string): Promise<UserAuthRecord | null>;

  /**
   * Record the identity provider's stable id on a user, best-effort, the first
   * time they sign in. Used for audit and robust account linking.
   */
  linkExternalId(userId: string, externalId: string): Promise<void>;
}

/**
 * A verified identity returned by an OpenID Connect provider — the subset of
 * ID-token claims we rely on, after the token's signature, issuer, audience,
 * expiry and nonce have already been checked by the OIDC client.
 */
export interface OidcIdentity {
  /** The `sub` claim: a stable, unique per-account id from the provider. */
  subject: string;
  email: string;
  /** The `email_verified` claim. We refuse sign-in when this is false. */
  emailVerified: boolean;
  /** The `hd` (hosted domain) claim, when the account belongs to a Google Workspace. */
  hostedDomain?: string;
  name?: string;
}

/**
 * The one-time values produced when a sign-in begins. The server must stash
 * these (securely, short-lived) and present them back at the callback so the
 * provider can verify the round-trip.
 */
export interface AuthorizationRequest {
  /** The provider URL to redirect the browser to. */
  url: string;
  /** CSRF value echoed back on the callback URL and compared by the server. */
  state: string;
  /** Replay-protection value the provider stamps inside the ID token. */
  nonce: string;
  /** PKCE secret revealed only at the back-channel token exchange. */
  codeVerifier: string;
}

/** The values the server hands back to the provider at the OAuth callback. */
export interface CallbackInput {
  /** The one-time authorization code from the provider's redirect. */
  code: string;
  /** The PKCE verifier stashed when the sign-in began. */
  codeVerifier: string;
  /** The nonce stashed when the sign-in began; the ID token must carry it. */
  expectedNonce: string;
}

/**
 * A thin port over the provider-specific OpenID Connect mechanics (building the
 * authorization URL, exchanging the code, verifying the ID token). The real
 * implementation wraps an OIDC client library in the server; tests supply a
 * fake. Keeping it behind this interface lets the provider's policy be unit
 * tested with no network.
 */
export interface OidcClient {
  /**
   * Build the authorization URL to redirect the browser to. Async because the
   * real implementation may need to discover the provider's configuration (a
   * network call) the first time it is used.
   */
  buildAuthorizationUrl(input: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): Promise<string>;

  /**
   * Exchange the callback code (back channel) and verify the resulting ID
   * token, including that its nonce matches `expectedNonce`. Returns the
   * verified identity, or throws if verification fails.
   */
  exchangeCode(input: CallbackInput): Promise<OidcIdentity>;
}

/**
 * A pluggable sign-in mechanism. Redirect-based providers (OpenID Connect)
 * implement a two-step flow: begin a sign-in (get an authorization URL), then
 * complete it from the provider's callback.
 */
export interface AuthProvider {
  /** Stable identifier, e.g. 'google-oidc'. */
  readonly name: string;

  /** Step 1 — begin a sign-in; returns the redirect URL and one-time values to stash. */
  createAuthorizationRequest(): Promise<AuthorizationRequest>;

  /**
   * Step 2 — complete a sign-in from the callback: verify the provider's
   * response and apply our provisioning policy. Returns the normalized identity
   * on success, or null on any failure (unverified email, disallowed domain,
   * no account, inactive) — a single null so callers can't enumerate accounts.
   */
  completeSignIn(input: CallbackInput): Promise<AuthenticatedUser | null>;
}
