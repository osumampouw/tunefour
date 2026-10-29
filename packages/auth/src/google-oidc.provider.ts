import {
  AuthenticatedUser,
  AuthorizationRequest,
  AuthProvider,
  CallbackInput,
  OidcClient,
  UserAuthStore,
} from './auth-provider.interface';
import {
  computeCodeChallenge,
  generateCodeVerifier,
  randomToken,
} from './crypto';
import { decideProvisioning, ProvisioningConfig } from './provisioning';

/**
 * Authentication provider that delegates sign-in to Google via OpenID Connect.
 *
 * It owns the one-time-value generation (state, nonce, PKCE) and the
 * provisioning policy; the provider-specific OIDC mechanics (authorization URL,
 * code exchange, ID-token verification) live behind the injected
 * {@link OidcClient}, so this class is unit-testable with no network.
 *
 * Because Google and Keycloak are both OpenID Connect, the same class can serve
 * Keycloak later by injecting an OIDC client pointed at a Keycloak issuer.
 */
export class GoogleOidcAuthProvider implements AuthProvider {
  readonly name = 'google-oidc';

  constructor(
    private readonly client: OidcClient,
    private readonly store: UserAuthStore,
    private readonly config: ProvisioningConfig,
  ) {}

  /** Begin a sign-in: mint the one-time values and build the Google redirect URL. */
  async createAuthorizationRequest(): Promise<AuthorizationRequest> {
    const state = randomToken();
    const nonce = randomToken();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = computeCodeChallenge(codeVerifier);
    const url = await this.client.buildAuthorizationUrl({
      state,
      nonce,
      codeChallenge,
    });
    return { url, state, nonce, codeVerifier };
  }

  /**
   * Complete a sign-in from the callback: verify the provider's response, then
   * apply the provisioning policy. Returns the normalized identity on success,
   * or null on any failure (so callers can't tell why — no account enumeration).
   */
  async completeSignIn(input: CallbackInput): Promise<AuthenticatedUser | null> {
    const identity = await this.client.exchangeCode(input);

    const email = identity.email.toLowerCase();
    const record = await this.store.findByEmail(email);
    const result = decideProvisioning(identity, this.config, record);
    if (!result.ok) {
      return null;
    }

    // Capture the provider's stable id the first time this user signs in, so we
    // have a durable link that survives a future email change. Best-effort.
    if (result.record.externalId === null) {
      await this.store.linkExternalId(result.record.id, identity.subject);
    }

    return result.user;
  }
}
