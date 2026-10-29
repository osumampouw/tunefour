import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '@tunefour/auth';

/**
 * Enforce that a user may act on a resource belonging to a given office.
 *
 * This is the fine-grained half of authorization (the coarse half — which
 * endpoints a role may call — is handled by the RolesGuard). A guard can't know
 * a resource's office without loading it, so services call this after fetching
 * the resource.
 *
 * - Org-wide users (officeId null) may touch any office.
 * - Office-scoped users may touch only their own office.
 *
 * @throws ForbiddenException if a scoped user targets another office.
 */
export function assertOfficeAccess(
  user: AuthenticatedUser,
  resourceOfficeId: string,
): void {
  if (user.officeId === null) {
    return; // org-wide role: any office
  }
  if (user.officeId === resourceOfficeId) {
    return; // scoped role: own office only
  }
  throw new ForbiddenException('Resource belongs to another office');
}
