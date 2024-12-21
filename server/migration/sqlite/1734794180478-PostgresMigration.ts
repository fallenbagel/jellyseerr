import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PostgresMigration1734794180478 implements MigrationInterface {
  name = 'PostgresMigration1734794180478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_f4fc4efa14c3ba2b29c4525fa15" FOREIGN KEY ("modifiedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_6997bee94720f1ecb7f31137095" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "media_request"`
    );
    await queryRunner.query(`DROP TABLE "media_request"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_media_request" RENAME TO "media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "status4k" integer NOT NULL DEFAULT (1), CONSTRAINT "FK_087099b39600be695591da9a49c" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "season"`
    );
    await queryRunner.query(`DROP TABLE "season"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_season" RENAME TO "season"`
    );
    await queryRunner.query(`DROP INDEX "IDX_939f205946256cc0d2a1ac51a8"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_watchlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ratingKey" varchar NOT NULL, "mediaType" varchar NOT NULL, "title" varchar NOT NULL, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestedById" integer, "mediaId" integer, CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_watchlist"("id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId") SELECT "id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId" FROM "watchlist"`
    );
    await queryRunner.query(`DROP TABLE "watchlist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_watchlist" RENAME TO "watchlist"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_939f205946256cc0d2a1ac51a8" ON "watchlist" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_6bbafa28411e6046421991ea21"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_blacklist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "title" varchar, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "mediaId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_blacklist"("id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId") SELECT "id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId" FROM "blacklist"`
    );
    await queryRunner.query(`DROP TABLE "blacklist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_blacklist" RENAME TO "blacklist"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bbafa28411e6046421991ea21" ON "blacklist" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_6bbafa28411e6046421991ea21"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_blacklist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "title" varchar, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "mediaId" integer, CONSTRAINT "UQ_5f933c8ed6ad2c31739e6b94886" UNIQUE ("tmdbId"), CONSTRAINT "UQ_e49b27917899e01d7aca6b0b15c" UNIQUE ("mediaId"))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_blacklist"("id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId") SELECT "id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId" FROM "blacklist"`
    );
    await queryRunner.query(`DROP TABLE "blacklist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_blacklist" RENAME TO "blacklist"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bbafa28411e6046421991ea21" ON "blacklist" ("tmdbId") `
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "media_request"`
    );
    await queryRunner.query(`DROP TABLE "media_request"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_media_request" RENAME TO "media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer NOT NULL, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "media_request"`
    );
    await queryRunner.query(`DROP TABLE "media_request"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_media_request" RENAME TO "media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "status4k" integer NOT NULL DEFAULT (1))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "season"`
    );
    await queryRunner.query(`DROP TABLE "season"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_season" RENAME TO "season"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer NOT NULL, "status4k" integer NOT NULL DEFAULT (1))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "season"`
    );
    await queryRunner.query(`DROP TABLE "season"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_season" RENAME TO "season"`
    );
    await queryRunner.query(`DROP INDEX "IDX_7ff2d11f6a83cb52386eaebe74"`);
    await queryRunner.query(`DROP INDEX "IDX_41a289eb1fa489c1bc6f38d9c3"`);
    await queryRunner.query(`DROP INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "tmdbId" integer NOT NULL, "tvdbId" integer, "imdbId" varchar, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "mediaAddedAt" datetime DEFAULT (CURRENT_TIMESTAMP), "serviceId" integer, "serviceId4k" integer, "externalServiceId" integer, "externalServiceId4k" integer, "externalServiceSlug" varchar, "externalServiceSlug4k" varchar, "ratingKey" varchar, "ratingKey4k" varchar, "jellyfinMediaId" varchar, "jellyfinMediaId4k" varchar, CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId"))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media"("id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k") SELECT "id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k" FROM "media"`
    );
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`ALTER TABLE "temporary_media" RENAME TO "media"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_7ff2d11f6a83cb52386eaebe74" ON "media" ("imdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a289eb1fa489c1bc6f38d9c3" ON "media" ("tvdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5" ON "media" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_939f205946256cc0d2a1ac51a8"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_watchlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ratingKey" varchar NOT NULL, "mediaType" varchar NOT NULL, "title" varchar NOT NULL, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestedById" integer, "mediaId" integer NOT NULL, CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_watchlist"("id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId") SELECT "id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId" FROM "watchlist"`
    );
    await queryRunner.query(`DROP TABLE "watchlist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_watchlist" RENAME TO "watchlist"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_939f205946256cc0d2a1ac51a8" ON "watchlist" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_6bbafa28411e6046421991ea21"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_blacklist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "title" varchar, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "mediaId" integer, CONSTRAINT "UQ_5f933c8ed6ad2c31739e6b94886" UNIQUE ("tmdbId"), CONSTRAINT "UQ_e49b27917899e01d7aca6b0b15c" UNIQUE ("mediaId"), CONSTRAINT "FK_53c1ab62c3e5875bc3ac474823e" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_62b7ade94540f9f8d8bede54b99" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_blacklist"("id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId") SELECT "id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId" FROM "blacklist"`
    );
    await queryRunner.query(`DROP TABLE "blacklist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_blacklist" RENAME TO "blacklist"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bbafa28411e6046421991ea21" ON "blacklist" ("tmdbId") `
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer NOT NULL, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_6997bee94720f1ecb7f31137095" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_f4fc4efa14c3ba2b29c4525fa15" FOREIGN KEY ("modifiedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "media_request"`
    );
    await queryRunner.query(`DROP TABLE "media_request"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_media_request" RENAME TO "media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer NOT NULL, "status4k" integer NOT NULL DEFAULT (1), CONSTRAINT "FK_087099b39600be695591da9a49c" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "season"`
    );
    await queryRunner.query(`DROP TABLE "season"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_season" RENAME TO "season"`
    );
    await queryRunner.query(`DROP INDEX "IDX_939f205946256cc0d2a1ac51a8"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_watchlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ratingKey" varchar NOT NULL, "mediaType" varchar NOT NULL, "title" varchar NOT NULL, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestedById" integer, "mediaId" integer NOT NULL, CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"), CONSTRAINT "FK_ae34e6b153a90672eb9dc4857d7" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_6641da8d831b93dfcb429f8b8bc" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_watchlist"("id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId") SELECT "id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId" FROM "watchlist"`
    );
    await queryRunner.query(`DROP TABLE "watchlist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_watchlist" RENAME TO "watchlist"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_939f205946256cc0d2a1ac51a8" ON "watchlist" ("tmdbId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_939f205946256cc0d2a1ac51a8"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" RENAME TO "temporary_watchlist"`
    );
    await queryRunner.query(
      `CREATE TABLE "watchlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ratingKey" varchar NOT NULL, "mediaType" varchar NOT NULL, "title" varchar NOT NULL, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestedById" integer, "mediaId" integer NOT NULL, CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"))`
    );
    await queryRunner.query(
      `INSERT INTO "watchlist"("id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId") SELECT "id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId" FROM "temporary_watchlist"`
    );
    await queryRunner.query(`DROP TABLE "temporary_watchlist"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_939f205946256cc0d2a1ac51a8" ON "watchlist" ("tmdbId") `
    );
    await queryRunner.query(
      `ALTER TABLE "season" RENAME TO "temporary_season"`
    );
    await queryRunner.query(
      `CREATE TABLE "season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer NOT NULL, "status4k" integer NOT NULL DEFAULT (1))`
    );
    await queryRunner.query(
      `INSERT INTO "season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "temporary_season"`
    );
    await queryRunner.query(`DROP TABLE "temporary_season"`);
    await queryRunner.query(
      `ALTER TABLE "media_request" RENAME TO "temporary_media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer NOT NULL, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0))`
    );
    await queryRunner.query(
      `INSERT INTO "media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "temporary_media_request"`
    );
    await queryRunner.query(`DROP TABLE "temporary_media_request"`);
    await queryRunner.query(`DROP INDEX "IDX_6bbafa28411e6046421991ea21"`);
    await queryRunner.query(
      `ALTER TABLE "blacklist" RENAME TO "temporary_blacklist"`
    );
    await queryRunner.query(
      `CREATE TABLE "blacklist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "title" varchar, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "mediaId" integer, CONSTRAINT "UQ_5f933c8ed6ad2c31739e6b94886" UNIQUE ("tmdbId"), CONSTRAINT "UQ_e49b27917899e01d7aca6b0b15c" UNIQUE ("mediaId"))`
    );
    await queryRunner.query(
      `INSERT INTO "blacklist"("id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId") SELECT "id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId" FROM "temporary_blacklist"`
    );
    await queryRunner.query(`DROP TABLE "temporary_blacklist"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6bbafa28411e6046421991ea21" ON "blacklist" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_939f205946256cc0d2a1ac51a8"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" RENAME TO "temporary_watchlist"`
    );
    await queryRunner.query(
      `CREATE TABLE "watchlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ratingKey" varchar NOT NULL, "mediaType" varchar NOT NULL, "title" varchar NOT NULL, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestedById" integer, "mediaId" integer, CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"))`
    );
    await queryRunner.query(
      `INSERT INTO "watchlist"("id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId") SELECT "id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId" FROM "temporary_watchlist"`
    );
    await queryRunner.query(`DROP TABLE "temporary_watchlist"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_939f205946256cc0d2a1ac51a8" ON "watchlist" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5"`);
    await queryRunner.query(`DROP INDEX "IDX_41a289eb1fa489c1bc6f38d9c3"`);
    await queryRunner.query(`DROP INDEX "IDX_7ff2d11f6a83cb52386eaebe74"`);
    await queryRunner.query(`ALTER TABLE "media" RENAME TO "temporary_media"`);
    await queryRunner.query(
      `CREATE TABLE "media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "tmdbId" integer NOT NULL, "tvdbId" integer, "imdbId" varchar, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "mediaAddedAt" datetime, "serviceId" integer, "serviceId4k" integer, "externalServiceId" integer, "externalServiceId4k" integer, "externalServiceSlug" varchar, "externalServiceSlug4k" varchar, "ratingKey" varchar, "ratingKey4k" varchar, "jellyfinMediaId" varchar, "jellyfinMediaId4k" varchar, CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId"))`
    );
    await queryRunner.query(
      `INSERT INTO "media"("id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k") SELECT "id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k" FROM "temporary_media"`
    );
    await queryRunner.query(`DROP TABLE "temporary_media"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5" ON "media" ("tmdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a289eb1fa489c1bc6f38d9c3" ON "media" ("tvdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ff2d11f6a83cb52386eaebe74" ON "media" ("imdbId") `
    );
    await queryRunner.query(
      `ALTER TABLE "season" RENAME TO "temporary_season"`
    );
    await queryRunner.query(
      `CREATE TABLE "season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "status4k" integer NOT NULL DEFAULT (1))`
    );
    await queryRunner.query(
      `INSERT INTO "season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "temporary_season"`
    );
    await queryRunner.query(`DROP TABLE "temporary_season"`);
    await queryRunner.query(
      `ALTER TABLE "season" RENAME TO "temporary_season"`
    );
    await queryRunner.query(
      `CREATE TABLE "season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "status4k" integer NOT NULL DEFAULT (1), CONSTRAINT "FK_087099b39600be695591da9a49c" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "temporary_season"`
    );
    await queryRunner.query(`DROP TABLE "temporary_season"`);
    await queryRunner.query(
      `ALTER TABLE "media_request" RENAME TO "temporary_media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0))`
    );
    await queryRunner.query(
      `INSERT INTO "media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "temporary_media_request"`
    );
    await queryRunner.query(`DROP TABLE "temporary_media_request"`);
    await queryRunner.query(
      `ALTER TABLE "media_request" RENAME TO "temporary_media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "temporary_media_request"`
    );
    await queryRunner.query(`DROP TABLE "temporary_media_request"`);
    await queryRunner.query(`DROP INDEX "IDX_6bbafa28411e6046421991ea21"`);
    await queryRunner.query(
      `ALTER TABLE "blacklist" RENAME TO "temporary_blacklist"`
    );
    await queryRunner.query(
      `CREATE TABLE "blacklist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "title" varchar, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "mediaId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "blacklist"("id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId") SELECT "id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId" FROM "temporary_blacklist"`
    );
    await queryRunner.query(`DROP TABLE "temporary_blacklist"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6bbafa28411e6046421991ea21" ON "blacklist" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_6bbafa28411e6046421991ea21"`);
    await queryRunner.query(
      `ALTER TABLE "blacklist" RENAME TO "temporary_blacklist"`
    );
    await queryRunner.query(
      `CREATE TABLE "blacklist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "title" varchar, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "mediaId" integer, CONSTRAINT "UQ_6bbafa28411e6046421991ea21c" UNIQUE ("tmdbId", "userId"))`
    );
    await queryRunner.query(
      `INSERT INTO "blacklist"("id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId") SELECT "id", "mediaType", "title", "tmdbId", "createdAt", "userId", "mediaId" FROM "temporary_blacklist"`
    );
    await queryRunner.query(`DROP TABLE "temporary_blacklist"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6bbafa28411e6046421991ea21" ON "blacklist" ("tmdbId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_939f205946256cc0d2a1ac51a8"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" RENAME TO "temporary_watchlist"`
    );
    await queryRunner.query(
      `CREATE TABLE "watchlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ratingKey" varchar NOT NULL, "mediaType" varchar NOT NULL, "title" varchar NOT NULL, "tmdbId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestedById" integer, "mediaId" integer, CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"))`
    );
    await queryRunner.query(
      `INSERT INTO "watchlist"("id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId") SELECT "id", "ratingKey", "mediaType", "title", "tmdbId", "createdAt", "updatedAt", "requestedById", "mediaId" FROM "temporary_watchlist"`
    );
    await queryRunner.query(`DROP TABLE "temporary_watchlist"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_939f205946256cc0d2a1ac51a8" ON "watchlist" ("tmdbId") `
    );
    await queryRunner.query(
      `ALTER TABLE "season" RENAME TO "temporary_season"`
    );
    await queryRunner.query(
      `CREATE TABLE "season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "status4k" integer NOT NULL DEFAULT (1), CONSTRAINT "FK_087099b39600be695591da9a49c" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "season"("id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "mediaId", "status4k" FROM "temporary_season"`
    );
    await queryRunner.query(`DROP TABLE "temporary_season"`);
    await queryRunner.query(
      `ALTER TABLE "media_request" RENAME TO "temporary_media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "mediaId" integer, "requestedById" integer, "modifiedById" integer, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_f4fc4efa14c3ba2b29c4525fa15" FOREIGN KEY ("modifiedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_6997bee94720f1ecb7f31137095" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "media_request"("id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest") SELECT "id", "status", "createdAt", "updatedAt", "type", "mediaId", "requestedById", "modifiedById", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest" FROM "temporary_media_request"`
    );
    await queryRunner.query(`DROP TABLE "temporary_media_request"`);
  }
}
