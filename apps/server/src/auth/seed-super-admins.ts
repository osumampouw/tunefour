/**
 * The bootstrap step that solves the chicken-and-egg of the first admin: nobody
 * can sign in without a user row, but nobody can create rows without first being
 * an admin. A configured list of emails is upserted as super-admins here.
 *
 * This file holds the pure logic (no database), so it is unit-testable; the CLI
 * wrapper (seed-admin.ts) supplies a TypeORM-backed store.
 */

/** The minimal store the seeding logic needs — implemented over TypeORM by the CLI. */
export interface SuperAdminSeedStore {
  /** Return a marker if a user with this email already exists, else null. */
  findByEmail(email: string): Promise<{ id: string } | null>;
  /** Create an active, org-wide super-admin user for this email. */
  createSuperAdmin(email: string): Promise<void>;
}

/** What the seed did: which emails it created, and which it left alone. */
export interface SeedResult {
  created: string[];
  skipped: string[];
}

/**
 * Parse the comma-separated SEED_SUPER_ADMIN_EMAILS value into a clean list of
 * lower-case emails (trimmed, blanks removed).
 */
export function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Upsert each email as a super-admin: create it if missing, skip it if it
 * already exists. Idempotent — safe to run repeatedly.
 */
export async function seedSuperAdmins(
  store: SuperAdminSeedStore,
  emails: string[],
): Promise<SeedResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const email of emails) {
    const existing = await store.findByEmail(email);
    if (existing) {
      skipped.push(email);
      continue;
    }
    await store.createSuperAdmin(email);
    created.push(email);
  }

  return { created, skipped };
}
