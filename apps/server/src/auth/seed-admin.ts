import 'reflect-metadata';
import 'dotenv/config';
import { Role } from '@tunefour/shared-types';
import dataSource from '../database/data-source';
import { User } from '../entities';
import { parseEmailList, seedSuperAdmins } from './seed-super-admins';

/**
 * CLI entry point for `pnpm --filter @tunefour/server seed:admin`.
 *
 * Reads SEED_SUPER_ADMIN_EMAILS (comma-separated) and upserts each as an active,
 * org-wide super-admin. This is how the very first admins get a user row, since
 * sign-in requires one to already exist. Idempotent and safe to re-run.
 */
async function main(): Promise<void> {
  const emails = parseEmailList(process.env.SEED_SUPER_ADMIN_EMAILS);
  if (emails.length === 0) {
    console.log('SEED_SUPER_ADMIN_EMAILS is empty; nothing to seed.');
    return;
  }

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const result = await seedSuperAdmins(
      {
        findByEmail: (email) =>
          users
            .findOne({ where: { email } })
            .then((user) => (user ? { id: user.id } : null)),
        createSuperAdmin: async (email) => {
          await users.save(
            users.create({
              email,
              role: Role.SuperAdmin,
              officeId: null,
              isActive: true,
              externalId: null,
            }),
          );
        },
      },
      emails,
    );
    console.log(
      `Seed complete. Created: [${result.created.join(', ')}]. ` +
        `Skipped (already exist): [${result.skipped.join(', ')}].`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('seed:admin failed', err);
  process.exit(1);
});
