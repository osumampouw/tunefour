import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from '@tunefour/auth';
import { CookieOptions, Request, Response } from 'express';
import {
  ACCESS_COOKIE,
  OAUTH_TX_COOKIE,
  REFRESH_COOKIE,
} from './auth.constants';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

type RequestWithCookies = Request & { cookies?: Record<string, string> };

/** How long the browser keeps the OAuth transaction cookie (matches the token TTL). */
const TX_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Authentication endpoints. Sign-in is a redirect flow: `GET /auth/google`
 * sends the browser to Google; `GET /auth/google/callback` completes it and sets
 * session cookies. `POST /auth/refresh` renews the access token, `GET /auth/me`
 * returns the current user, and `POST /auth/logout` clears the cookies.
 */
@Controller('auth')
export class AuthController {
  private readonly secureCookies: boolean;
  private readonly postLoginUrl: string;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.secureCookies = config.get<string>('NODE_ENV') === 'production';
    this.postLoginUrl = config.get<string>(
      'WEB_APP_POST_LOGIN_URL',
      'http://localhost:3000',
    );
  }

  /** Begin sign-in: stash the OAuth transaction and redirect the browser to Google. */
  @Public()
  @Get('google')
  async startGoogle(@Res() res: Response): Promise<void> {
    const { redirectUrl, transactionToken } = await this.auth.beginSignIn();
    res.cookie(
      OAUTH_TX_COOKIE,
      transactionToken,
      this.cookieOptions(TX_COOKIE_MAX_AGE_MS),
    );
    res.redirect(redirectUrl);
  }

  /** Google redirects here with the authorization code; verify and start a session. */
  @Public()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: RequestWithCookies,
    @Res() res: Response,
  ): Promise<void> {
    if (!code || !state) {
      throw new UnauthorizedException('Missing authorization code');
    }
    const session = await this.auth.completeSignIn({
      code,
      state,
      transactionToken: req.cookies?.[OAUTH_TX_COOKIE],
    });

    res.clearCookie(OAUTH_TX_COOKIE, this.cookieOptions());
    res.cookie(ACCESS_COOKIE, session.accessToken, this.cookieOptions());
    res.cookie(REFRESH_COOKIE, session.refreshToken, this.cookieOptions());
    res.redirect(this.postLoginUrl);
  }

  /** Exchange a valid refresh token (cookie or body) for a new access token. */
  @Public()
  @Post('refresh')
  refresh(
    @Req() req: RequestWithCookies,
    @Body() body: { refreshToken?: string } | undefined,
    @Res({ passthrough: true }) res: Response,
  ): { accessToken: string } {
    const refreshToken = body?.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    const { accessToken } = this.auth.refresh(refreshToken);
    res.cookie(ACCESS_COOKIE, accessToken, this.cookieOptions());
    return { accessToken };
  }

  /** Return the currently authenticated user. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  /** Clear the session cookies. Stateless logout — no server-side revocation (MVP). */
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions());
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  private cookieOptions(maxAgeMs?: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: 'lax',
      path: '/',
      ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
    };
  }
}
