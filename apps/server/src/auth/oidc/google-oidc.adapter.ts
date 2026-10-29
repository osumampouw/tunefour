import { OidcClient, OidcIdentity } from '@tunefour/auth';
import { BaseClient, Issuer } from 'openid-client';

/** Settings needed to talk to the OpenID Connect provider (Google now, Keycloak later). */
export interface GoogleOidcConfig {
  /** Issuer URL, e.g. https://accounts.google.com — discovery reads its well-known config. */
  issuer: string;
  clientId: string;
  clientSecret: string;
  /** Our registered callback URL, e.g. https://admin.…/auth/google/callback. */
  redirectUri: string;
}

/**
 * Real {@link OidcClient} implementation over the `openid-client` library. This
 * is the thin I/O adapter the design keeps isolated: it performs provider
 * discovery, builds the authorization URL, and does the back-channel code
 * exchange with full ID-token verification (signature, issuer, audience,
 * expiry, nonce). All sign-in policy lives in the pure auth package, not here.
 *
 * Discovery is lazy (cached on first use) so the server boots even when the
 * provider is unreachable or not yet configured.
 */
export class GoogleOidcClientAdapter implements OidcClient {
  private clientPromise?: Promise<BaseClient>;

  constructor(private readonly config: GoogleOidcConfig) {}

  async buildAuthorizationUrl(input: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): Promise<string> {
    const client = await this.getClient();
    return client.authorizationUrl({
      // We only need identity, not access to any Google data.
      scope: 'openid email profile',
      state: input.state,
      nonce: input.nonce,
      code_challenge: input.codeChallenge,
      code_challenge_method: 'S256',
    });
  }

  async exchangeCode(input: {
    code: string;
    codeVerifier: string;
    expectedNonce: string;
  }): Promise<OidcIdentity> {
    const client = await this.getClient();
    // openid-client verifies the ID token (signature/iss/aud/exp) and checks the
    // nonce matches, throwing if any check fails.
    const tokenSet = await client.callback(
      this.config.redirectUri,
      { code: input.code },
      { code_verifier: input.codeVerifier, nonce: input.expectedNonce },
    );
    const claims = tokenSet.claims();
    return {
      subject: claims.sub,
      email: typeof claims.email === 'string' ? claims.email : '',
      emailVerified: claims.email_verified === true,
      hostedDomain: typeof claims.hd === 'string' ? claims.hd : undefined,
      name: typeof claims.name === 'string' ? claims.name : undefined,
    };
  }

  /** Discover the provider and build the client once; reuse it thereafter. */
  private getClient(): Promise<BaseClient> {
    if (!this.clientPromise) {
      this.clientPromise = Issuer.discover(this.config.issuer).then(
        (issuer) =>
          new issuer.Client({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            redirect_uris: [this.config.redirectUri],
            response_types: ['code'],
          }),
      );
    }
    return this.clientPromise;
  }
}
