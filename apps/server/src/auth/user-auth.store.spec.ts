import { Role } from '@tunefour/shared-types';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { TypeOrmUserAuthStore } from './user-auth.store';

function fakeUser(): User {
  return {
    id: 'user-1',
    email: 'alice@cermati.com',
    role: Role.OfficeManager,
    officeId: 'office-1',
    isActive: true,
    externalId: null,
  } as User;
}

describe('TypeOrmUserAuthStore', () => {
  it('maps a found user to a UserAuthRecord', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(fakeUser()),
      update: jest.fn(),
    } as unknown as Repository<User>;
    const store = new TypeOrmUserAuthStore(repo);

    const record = await store.findByEmail('alice@cermati.com');

    expect(record).toEqual({
      id: 'user-1',
      email: 'alice@cermati.com',
      role: Role.OfficeManager,
      officeId: 'office-1',
      isActive: true,
      externalId: null,
    });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: 'alice@cermati.com' },
    });
  });

  it('returns null when no user matches', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<User>;
    const store = new TypeOrmUserAuthStore(repo);

    expect(await store.findByEmail('nobody@cermati.com')).toBeNull();
  });

  it('writes the external id when linking', async () => {
    const repo = {
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<User>;
    const store = new TypeOrmUserAuthStore(repo);

    await store.linkExternalId('user-1', 'google-sub-123');

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { externalId: 'google-sub-123' },
    );
  });
});
