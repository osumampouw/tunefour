import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '@tunefour/auth';
import { Role } from '@tunefour/shared-types';
import { RolesGuard } from './roles.guard';

function context(user?: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

/** A Reflector whose metadata lookup always returns `value`. */
function reflectorReturning(value: Role[] | undefined): Reflector {
  return { getAllAndOverride: () => value } as unknown as Reflector;
}

const officeManager: AuthenticatedUser = {
  userId: 'u1',
  email: 'a@cermati.com',
  role: Role.OfficeManager,
  officeId: 'office-1',
};

describe('RolesGuard', () => {
  it('allows any authenticated user when no roles are required', () => {
    const guard = new RolesGuard(reflectorReturning(undefined));
    expect(guard.canActivate(context(officeManager))).toBe(true);
  });

  it('allows when the user has one of the required roles', () => {
    const guard = new RolesGuard(
      reflectorReturning([Role.OfficeManager, Role.SuperAdmin]),
    );
    expect(guard.canActivate(context(officeManager))).toBe(true);
  });

  it('forbids when the user role is not in the allowed set', () => {
    const guard = new RolesGuard(reflectorReturning([Role.SuperAdmin]));
    expect(() => guard.canActivate(context(officeManager))).toThrow(
      ForbiddenException,
    );
  });

  it('forbids when roles are required but no user is present', () => {
    const guard = new RolesGuard(reflectorReturning([Role.SuperAdmin]));
    expect(() => guard.canActivate(context(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
