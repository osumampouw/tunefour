import { SetMetadata } from '@nestjs/common';
import { Role } from '@tunefour/shared-types';

/** Metadata key holding the roles allowed to call a route. */
export const ROLES_KEY = 'tunefour:roles';

/**
 * Restrict a route to one or more roles. The global RolesGuard reads this and
 * rejects users whose role is not listed. A route with no `@Roles(...)` is open
 * to any authenticated user.
 *
 * @example
 *   @Roles(Role.SuperAdmin)
 *   @Delete(':id')
 *   remove() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
