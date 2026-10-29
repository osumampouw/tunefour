import {
  parseEmailList,
  seedSuperAdmins,
  SuperAdminSeedStore,
} from './seed-super-admins';

describe('parseEmailList', () => {
  it('splits, trims, lower-cases, and drops blanks', () => {
    expect(parseEmailList(' Oby@Cermati.com , ops@cermati.com ,')).toEqual([
      'oby@cermati.com',
      'ops@cermati.com',
    ]);
  });

  it('returns an empty list for undefined or empty input', () => {
    expect(parseEmailList(undefined)).toEqual([]);
    expect(parseEmailList('')).toEqual([]);
    expect(parseEmailList('  ,  ')).toEqual([]);
  });
});

/** An in-memory seed store seeded with the given already-existing emails. */
function fakeStore(existing: string[] = []): SuperAdminSeedStore & {
  createdEmails: string[];
} {
  const present = new Set(existing);
  return {
    createdEmails: [],
    findByEmail(email: string) {
      return Promise.resolve(present.has(email) ? { id: `id-${email}` } : null);
    },
    createSuperAdmin(email: string) {
      present.add(email);
      this.createdEmails.push(email);
      return Promise.resolve();
    },
  };
}

describe('seedSuperAdmins', () => {
  it('creates all missing admins', async () => {
    const store = fakeStore();

    const result = await seedSuperAdmins(store, [
      'oby@cermati.com',
      'ops@cermati.com',
    ]);

    expect(result.created).toEqual(['oby@cermati.com', 'ops@cermati.com']);
    expect(result.skipped).toEqual([]);
    expect(store.createdEmails).toEqual(['oby@cermati.com', 'ops@cermati.com']);
  });

  it('skips admins that already exist (idempotent)', async () => {
    const store = fakeStore(['oby@cermati.com']);

    const result = await seedSuperAdmins(store, [
      'oby@cermati.com',
      'ops@cermati.com',
    ]);

    expect(result.created).toEqual(['ops@cermati.com']);
    expect(result.skipped).toEqual(['oby@cermati.com']);
  });

  it('does nothing for an empty list', async () => {
    const store = fakeStore();
    const result = await seedSuperAdmins(store, []);
    expect(result).toEqual({ created: [], skipped: [] });
    expect(store.createdEmails).toEqual([]);
  });
});
