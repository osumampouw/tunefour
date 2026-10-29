import { SetMetadata } from '@nestjs/common';

/** Metadata key marking a route as public (skips the global JwtAuthGuard). */
export const IS_PUBLIC_KEY = 'tunefour:isPublic';

/**
 * Mark a route (or controller) as public, so the global authentication guard
 * lets it through without a session token — e.g. the login and OAuth callback
 * routes.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
