import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthenticatedUser } from '@tunefour/auth';
import { Role } from '@tunefour/shared-types';

/** A pair of session tokens issued after a successful sign-in. */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** The claims we store in both access and refresh tokens. */
interface TokenClaims {
  /** Subject — the user id. */
  sub: string;
  email: string;
  role: Role;
  officeId: string | null;
}

/**
 * Issues and verifies the application's own session tokens (JWTs), independent
 * of how the user authenticated. After any provider establishes identity, the
 * rest of the app only deals with these tokens.
 *
 * Refresh uses absolute expiry: when the refresh token reaches its lifetime the
 * user signs in with Google again (usually a silent redirect). Tokens are
 * stateless (no server-side store) — revocation is deferred (see Phase 7).
 */
@Injectable()
export class AuthTokensService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessTtl = config.get<string>('JWT_ACCESS_TTL', '15m');
    this.refreshTtl = config.get<string>('JWT_REFRESH_TTL', '7d');
  }

  /** Issue a fresh access + refresh token pair for a signed-in user. */
  issueSession(user: AuthenticatedUser): SessionTokens {
    const claims = this.toClaims(user);
    return {
      accessToken: this.jwt.sign(claims, this.signOptions(this.accessSecret, this.accessTtl)),
      refreshToken: this.jwt.sign(claims, this.signOptions(this.refreshSecret, this.refreshTtl)),
    };
  }

  /** Verify an access token and return the identity, or throw if it is invalid/expired. */
  verifyAccessToken(token: string): AuthenticatedUser {
    return this.verify(token, this.accessSecret);
  }

  /**
   * Exchange a valid refresh token for a new access token. The refresh token
   * itself is unchanged (absolute expiry), so the overall session still ends at
   * the original refresh-token expiry.
   */
  refreshAccessToken(refreshToken: string): { accessToken: string } {
    const user = this.verify(refreshToken, this.refreshSecret);
    const claims = this.toClaims(user);
    return {
      accessToken: this.jwt.sign(claims, this.signOptions(this.accessSecret, this.accessTtl)),
    };
  }

  /**
   * Build JWT sign options. The cast narrows our runtime TTL string to the
   * library's expected literal duration type (e.g. "15m"); the value is
   * validated by the JWT library at sign time.
   */
  private signOptions(secret: string, ttl: string): JwtSignOptions {
    return { secret, expiresIn: ttl as JwtSignOptions['expiresIn'] };
  }

  private toClaims(user: AuthenticatedUser): TokenClaims {
    return {
      sub: user.userId,
      email: user.email,
      role: user.role,
      officeId: user.officeId,
    };
  }

  private verify(token: string, secret: string): AuthenticatedUser {
    let claims: TokenClaims;
    try {
      claims = this.jwt.verify<TokenClaims>(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return {
      userId: claims.sub,
      email: claims.email,
      role: claims.role,
      officeId: claims.officeId,
    };
  }
}
