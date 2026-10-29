import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthProvider, GoogleOidcAuthProvider } from '@tunefour/auth';
import { User } from '../entities';
import { AUTH_PROVIDER } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleOidcClientAdapter } from './oidc/google-oidc.adapter';
import { AuthTokensService } from './tokens/auth-tokens.service';
import { TypeOrmUserAuthStore } from './user-auth.store';

/** Split a comma-separated domain list into a clean, lower-case array. */
function parseAllowedDomains(raw: string): string[] {
  return raw
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => domain.length > 0);
}

/**
 * Build the active authentication provider from configuration. Today that is
 * Google via OpenID Connect; because Keycloak is also OIDC, switching later is a
 * configuration change (issuer + credentials), not new code.
 *
 * Missing credentials don't crash startup (discovery is lazy, and an empty
 * domain list fails closed), so the server still boots for non-auth work in dev.
 */
function buildAuthProvider(
  config: ConfigService,
  store: TypeOrmUserAuthStore,
): AuthProvider {
  const adapter = new GoogleOidcClientAdapter({
    issuer: config.get<string>('OIDC_ISSUER', 'https://accounts.google.com'),
    clientId: config.get<string>('OIDC_CLIENT_ID', ''),
    clientSecret: config.get<string>('OIDC_CLIENT_SECRET', ''),
    redirectUri: config.get<string>(
      'OIDC_REDIRECT_URI',
      'http://localhost:3001/auth/google/callback',
    ),
  });
  const allowedDomains = parseAllowedDomains(
    config.get<string>('AUTH_ALLOWED_DOMAINS', ''),
  );
  return new GoogleOidcAuthProvider(adapter, store, { allowedDomains });
}

/**
 * Wires authentication and access control: the Google SSO provider, session
 * tokens, the OAuth endpoints, and the two global guards (authenticate every
 * request, then enforce roles). JwtAuthGuard is registered first so the user is
 * attached before RolesGuard runs.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthTokensService,
    AuthService,
    TypeOrmUserAuthStore,
    {
      provide: AUTH_PROVIDER,
      useFactory: buildAuthProvider,
      inject: [ConfigService, TypeOrmUserAuthStore],
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthTokensService],
})
export class AuthModule {}
