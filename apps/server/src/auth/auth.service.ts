import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from '@tunefour/auth';
import { AUTH_PROVIDER } from './auth.constants';
import { AuthTokensService, SessionTokens } from './tokens/auth-tokens.service';

/** The one-time values stashed between the redirect to Google and the callback. */
interface OauthTransaction {
  state: string;
  nonce: string;
  codeVerifier: string;
}

/** What `beginSignIn` returns: where to send the browser, and the signed transaction to stash. */
export interface SignInStart {
  redirectUrl: string;
  /** A signed JWT holding the OAuth transaction; the caller stores it in a short-lived cookie. */
  transactionToken: string;
}

/** Marker claim so a transaction token can't be confused with a session token. */
const TX_TYPE = 'oauth-tx';
/** How long a user has to complete the Google redirect before the transaction expires. */
const TX_TTL = '10m';

/**
 * Orchestrates the OAuth/OIDC sign-in: it drives the configured
 * {@link AuthProvider}, carries the one-time values across the redirect in a
 * signed transaction token, verifies the `state` on return, and issues the
 * application's session tokens on success.
 */
@Injectable()
export class AuthService {
  private readonly txSecret: string;

  constructor(
    @Inject(AUTH_PROVIDER) private readonly provider: AuthProvider,
    private readonly tokens: AuthTokensService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    // Reuse the access secret to sign the short-lived transaction token; the
    // TX_TYPE claim keeps it distinct from a real session token.
    this.txSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  /** Begin a sign-in: build the Google redirect URL and a signed transaction to stash. */
  async beginSignIn(): Promise<SignInStart> {
    const request = await this.provider.createAuthorizationRequest();
    const transactionToken = this.jwt.sign(
      {
        typ: TX_TYPE,
        state: request.state,
        nonce: request.nonce,
        codeVerifier: request.codeVerifier,
      },
      { secret: this.txSecret, expiresIn: TX_TTL },
    );
    return { redirectUrl: request.url, transactionToken };
  }

  /**
   * Complete a sign-in from the OAuth callback: verify the stashed transaction,
   * check the `state` (CSRF), let the provider verify the code and apply
   * provisioning, then issue session tokens.
   *
   * @throws UnauthorizedException on any failure (a single error, so callers
   *   can't tell a denied domain from a missing account).
   */
  async completeSignIn(params: {
    code: string;
    state: string;
    transactionToken: string | undefined;
  }): Promise<SessionTokens> {
    const transaction = this.verifyTransaction(params.transactionToken);
    if (params.state !== transaction.state) {
      throw new UnauthorizedException('State mismatch');
    }

    let user;
    try {
      user = await this.provider.completeSignIn({
        code: params.code,
        codeVerifier: transaction.codeVerifier,
        expectedNonce: transaction.nonce,
      });
    } catch {
      // Any failure verifying the code/ID token means the sign-in failed.
      throw new UnauthorizedException('Sign-in failed');
    }
    if (!user) {
      throw new UnauthorizedException('Sign-in denied');
    }

    return this.tokens.issueSession(user);
  }

  /** Exchange a valid refresh token for a new access token. */
  refresh(refreshToken: string | undefined): { accessToken: string } {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this.tokens.refreshAccessToken(refreshToken);
  }

  private verifyTransaction(token: string | undefined): OauthTransaction {
    if (!token) {
      throw new UnauthorizedException('Missing sign-in transaction');
    }
    try {
      const claims = this.jwt.verify<OauthTransaction & { typ?: string }>(token, {
        secret: this.txSecret,
      });
      if (claims.typ !== TX_TYPE) {
        throw new Error('wrong token type');
      }
      return {
        state: claims.state,
        nonce: claims.nonce,
        codeVerifier: claims.codeVerifier,
      };
    } catch {
      throw new UnauthorizedException('Invalid sign-in transaction');
    }
  }
}
