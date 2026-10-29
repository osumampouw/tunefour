import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Switches admin-portal users from local (email + password) auth to Google SSO:
 * drops the password hash we no longer store, and adds a nullable `externalId`
 * for the identity provider's stable account id (Google's `sub`), captured on
 * first sign-in. See docs/phase1-auth-rbac.html.
 */
export class SwitchUsersToSso1793100000000 implements MigrationInterface {
  name = 'SwitchUsersToSso1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "externalId" text`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_externalId" ON "users" ("externalId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_externalId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "externalId"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordHash" text NOT NULL`,
    );
  }
}
