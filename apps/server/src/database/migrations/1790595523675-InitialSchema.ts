import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790595523675 implements MigrationInterface {
    name = 'InitialSchema1790595523675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Required for the uuid_generate_v4() default on UUID primary keys.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."assets_type_enum" AS ENUM('image', 'video', 'html', 'url')`);
        await queryRunner.query(`CREATE TABLE "assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."assets_type_enum" NOT NULL, "name" text NOT NULL, "storageKey" text, "url" text, "checksum" text, "defaultDurationSec" integer NOT NULL, "width" integer, "height" integer, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "device_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0a85eb3da91cda682e08b66ae77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."device_credentials_type_enum" AS ENUM('jwt', 'cert')`);
        await queryRunner.query(`CREATE TABLE "device_credentials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deviceId" uuid NOT NULL, "type" "public"."device_credentials_type_enum" NOT NULL DEFAULT 'jwt', "secretHash" text, "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE, "revokedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_96678b2954bc2c8d4d5be68f011" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8e286ed3f2686f622ec7b6fffa" ON "device_credentials" ("deviceId") `);
        await queryRunner.query(`CREATE TYPE "public"."devices_orientation_enum" AS ENUM('landscape', 'portrait')`);
        await queryRunner.query(`CREATE TYPE "public"."devices_status_enum" AS ENUM('online', 'offline', 'unenrolled')`);
        await queryRunner.query(`CREATE TYPE "public"."devices_enrollmentstate_enum" AS ENUM('pending', 'active', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "officeId" uuid NOT NULL, "name" text NOT NULL, "resolution" text, "orientation" "public"."devices_orientation_enum" NOT NULL DEFAULT 'landscape', "rotation" integer NOT NULL DEFAULT '0', "status" "public"."devices_status_enum" NOT NULL DEFAULT 'unenrolled', "enrollmentState" "public"."devices_enrollmentstate_enum" NOT NULL DEFAULT 'pending', "lastSeenAt" TIMESTAMP WITH TIME ZONE, "currentManifestVersion" text, "appVersion" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bfe9edb2dab86e494816cbba68" ON "devices" ("officeId") `);
        await queryRunner.query(`CREATE TABLE "offices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "timezone" text NOT NULL, "address" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1ea41502c6dddcec44ad9fcbbb3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super-admin', 'content-editor', 'office-manager', 'front-desk', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "passwordHash" text NOT NULL, "role" "public"."users_role_enum" NOT NULL, "officeId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" uuid, "actorEmail" text, "action" text NOT NULL, "targetType" text, "targetId" text, "ip" text, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."playlist_items_transition_enum" AS ENUM('none', 'fade')`);
        await queryRunner.query(`CREATE TABLE "playlist_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "playlistId" uuid NOT NULL, "assetId" uuid NOT NULL, "order" integer NOT NULL, "durationSec" integer, "transition" "public"."playlist_items_transition_enum" NOT NULL DEFAULT 'none', CONSTRAINT "PK_7611a5dd2c94a803c58ccfc65f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f24a07084bf159c7da873c9ab" ON "playlist_items" ("playlistId", "order") `);
        await queryRunner.query(`CREATE TABLE "playlists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a4597f4189a75d20507f3f7ef0d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."schedules_targettype_enum" AS ENUM('office', 'group', 'device')`);
        await queryRunner.query(`CREATE TYPE "public"."schedules_boundarypolicy_enum" AS ENUM('finish', 'hardcut')`);
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetType" "public"."schedules_targettype_enum" NOT NULL, "officeId" uuid, "deviceGroupId" uuid, "deviceId" uuid, "playlistId" uuid NOT NULL, "priority" integer NOT NULL DEFAULT '0', "recurrence" text, "startAt" TIMESTAMP WITH TIME ZONE, "endAt" TIMESTAMP WITH TIME ZONE, "daypartStart" text, "daypartEnd" text, "boundaryPolicy" "public"."schedules_boundarypolicy_enum" NOT NULL DEFAULT 'finish', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_47981e9423799f76b22d6905e2" ON "schedules" ("targetType", "priority") `);
        await queryRunner.query(`CREATE TYPE "public"."welcome_messages_targettype_enum" AS ENUM('office', 'group', 'device')`);
        await queryRunner.query(`CREATE TYPE "public"."welcome_messages_triggertype_enum" AS ENUM('scheduled', 'live')`);
        await queryRunner.query(`CREATE TABLE "welcome_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetType" "public"."welcome_messages_targettype_enum" NOT NULL, "officeId" uuid, "deviceId" uuid, "template" text NOT NULL, "variables" jsonb, "triggerType" "public"."welcome_messages_triggertype_enum" NOT NULL, "scheduledStart" TIMESTAMP WITH TIME ZONE, "scheduledEnd" TIMESTAMP WITH TIME ZONE, "durationSec" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4dbea401409dd9bc27d01d5a0df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "device_group_devices" ("deviceGroupsId" uuid NOT NULL, "devicesId" uuid NOT NULL, CONSTRAINT "PK_fa576312520b353ac6c836f8ab4" PRIMARY KEY ("deviceGroupsId", "devicesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_168a9942d594e9591ce3694780" ON "device_group_devices" ("deviceGroupsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_49ada2eddcab74c27e07243a35" ON "device_group_devices" ("devicesId") `);
        await queryRunner.query(`ALTER TABLE "device_credentials" ADD CONSTRAINT "FK_8e286ed3f2686f622ec7b6fffa3" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_bfe9edb2dab86e494816cbba684" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f7f69295d570c80f210703300f1" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "playlist_items" ADD CONSTRAINT "FK_1a5c30e99b5283b5653ee29b6b5" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "playlist_items" ADD CONSTRAINT "FK_be76ae8b8e6dace03c7b98fabf1" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_d15e04dac83c250547bd2635b56" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_22a371df1cdbb6f9d16b6eb16d7" FOREIGN KEY ("deviceGroupId") REFERENCES "device_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_bd211e65909c79b344ccde34278" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_ce82879ffe2024d887d792e4e07" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "welcome_messages" ADD CONSTRAINT "FK_03b9a6878d988426c5c45cd0194" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "welcome_messages" ADD CONSTRAINT "FK_517edca14cd53c7519f0e9bdf3b" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_group_devices" ADD CONSTRAINT "FK_168a9942d594e9591ce36947809" FOREIGN KEY ("deviceGroupsId") REFERENCES "device_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "device_group_devices" ADD CONSTRAINT "FK_49ada2eddcab74c27e07243a359" FOREIGN KEY ("devicesId") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_group_devices" DROP CONSTRAINT "FK_49ada2eddcab74c27e07243a359"`);
        await queryRunner.query(`ALTER TABLE "device_group_devices" DROP CONSTRAINT "FK_168a9942d594e9591ce36947809"`);
        await queryRunner.query(`ALTER TABLE "welcome_messages" DROP CONSTRAINT "FK_517edca14cd53c7519f0e9bdf3b"`);
        await queryRunner.query(`ALTER TABLE "welcome_messages" DROP CONSTRAINT "FK_03b9a6878d988426c5c45cd0194"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_ce82879ffe2024d887d792e4e07"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_bd211e65909c79b344ccde34278"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_22a371df1cdbb6f9d16b6eb16d7"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_d15e04dac83c250547bd2635b56"`);
        await queryRunner.query(`ALTER TABLE "playlist_items" DROP CONSTRAINT "FK_be76ae8b8e6dace03c7b98fabf1"`);
        await queryRunner.query(`ALTER TABLE "playlist_items" DROP CONSTRAINT "FK_1a5c30e99b5283b5653ee29b6b5"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f7f69295d570c80f210703300f1"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_bfe9edb2dab86e494816cbba684"`);
        await queryRunner.query(`ALTER TABLE "device_credentials" DROP CONSTRAINT "FK_8e286ed3f2686f622ec7b6fffa3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49ada2eddcab74c27e07243a35"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_168a9942d594e9591ce3694780"`);
        await queryRunner.query(`DROP TABLE "device_group_devices"`);
        await queryRunner.query(`DROP TABLE "welcome_messages"`);
        await queryRunner.query(`DROP TYPE "public"."welcome_messages_triggertype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."welcome_messages_targettype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_47981e9423799f76b22d6905e2"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`DROP TYPE "public"."schedules_boundarypolicy_enum"`);
        await queryRunner.query(`DROP TYPE "public"."schedules_targettype_enum"`);
        await queryRunner.query(`DROP TABLE "playlists"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f24a07084bf159c7da873c9ab"`);
        await queryRunner.query(`DROP TABLE "playlist_items"`);
        await queryRunner.query(`DROP TYPE "public"."playlist_items_transition_enum"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "offices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bfe9edb2dab86e494816cbba68"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP TYPE "public"."devices_enrollmentstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."devices_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."devices_orientation_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e286ed3f2686f622ec7b6fffa"`);
        await queryRunner.query(`DROP TABLE "device_credentials"`);
        await queryRunner.query(`DROP TYPE "public"."device_credentials_type_enum"`);
        await queryRunner.query(`DROP TABLE "device_groups"`);
        await queryRunner.query(`DROP TABLE "assets"`);
        await queryRunner.query(`DROP TYPE "public"."assets_type_enum"`);
    }

}
