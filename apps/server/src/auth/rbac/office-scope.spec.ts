import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '@tunefour/auth';
import { Role } from '@tunefour/shared-types';
import { assertOfficeAccess } from './office-scope';

function user(officeId: string | null, role: Role): AuthenticatedUser {
  return { userId: 'u1', email: 'a@cermati.com', role, officeId };
}

describe('assertOfficeAccess', () => {
  it('allows an org-wide user (officeId null) to access any office', () => {
    const orgWide = user(null, Role.SuperAdmin);
    expect(() => assertOfficeAccess(orgWide, 'office-A')).not.toThrow();
    expect(() => assertOfficeAccess(orgWide, 'office-B')).not.toThrow();
  });

  it('allows a scoped user to access their own office', () => {
    const scoped = user('office-A', Role.OfficeManager);
    expect(() => assertOfficeAccess(scoped, 'office-A')).not.toThrow();
  });

  it('forbids a scoped user from accessing another office', () => {
    const scoped = user('office-A', Role.OfficeManager);
    expect(() => assertOfficeAccess(scoped, 'office-B')).toThrow(
      ForbiddenException,
    );
  });
});
