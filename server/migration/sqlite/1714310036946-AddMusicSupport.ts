import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMusicSupport1714310036946 implements MigrationInterface {
  name = 'AddMusicSupport1714310036946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "musicQuotaLimit" integer`);
    await queryRunner.query(`ALTER TABLE "user" ADD "musicQuotaDays" integer`);

    await queryRunner.query(`DROP INDEX "IDX_7ff2d11f6a83cb52386eaebe74"`);
    await queryRunner.query(`DROP INDEX "IDX_41a289eb1fa489c1bc6f38d9c3"`);
    await queryRunner.query(`DROP INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "temporary_watchlist"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_watchlist" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "ratingKey" varchar NOT NULL,
        "mediaType" varchar NOT NULL,
        "title" varchar NOT NULL,
        "tmdbId" integer,
        "mbId" varchar,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "requestedById" integer,
        "mediaId" integer,
        CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"),
        CONSTRAINT "UNIQUE_USER_FOREIGN" UNIQUE ("mbId", "requestedById"),
        CONSTRAINT "FK_ae34e6b153a90672eb9dc4857d7" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_6641da8d831b93dfcb429f8b8bc" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`
    );

    await queryRunner.query(
      `INSERT INTO "temporary_watchlist"(
        "id", "ratingKey", "mediaType", "title", "tmdbId",
        "createdAt", "updatedAt", "requestedById", "mediaId"
      ) SELECT
        "id", "ratingKey", "mediaType", "title", "tmdbId",
        "createdAt", "updatedAt", "requestedById", "mediaId"
      FROM "watchlist"`
    );

    await queryRunner.query(`DROP TABLE "watchlist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_watchlist" RENAME TO "watchlist"`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_watchlist_mbid" ON "watchlist" ("mbId")`
    );

    await queryRunner.query(
      `CREATE TABLE "temporary_media" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaType" varchar NOT NULL,
        "tmdbId" integer,
        "tvdbId" integer,
        "imdbId" varchar,
        "mbId" varchar,
        "status" integer NOT NULL DEFAULT (1),
        "status4k" integer NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "mediaAddedAt" datetime,
        "serviceId" integer,
        "serviceId4k" integer,
        "externalServiceId" integer,
        "externalServiceId4k" integer,
        "externalServiceSlug" varchar,
        "externalServiceSlug4k" varchar,
        "ratingKey" varchar,
        "ratingKey4k" varchar,
        "jellyfinMediaId" varchar,
        "jellyfinMediaId4k" varchar,
        CONSTRAINT "CHK_media_type" CHECK ("mediaType" IN ('movie', 'tv', 'music'))
      )`
    );

    await queryRunner.query(
      `INSERT INTO "temporary_media"(
        "id", "mediaType", "tmdbId", "tvdbId", "imdbId",
        "status", "status4k", "createdAt", "updatedAt",
        "lastSeasonChange", "mediaAddedAt", "serviceId",
        "serviceId4k", "externalServiceId", "externalServiceId4k",
        "externalServiceSlug", "externalServiceSlug4k",
        "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k"
      ) SELECT
        "id", "mediaType", "tmdbId", "tvdbId", "imdbId",
        "status", "status4k", "createdAt", "updatedAt",
        "lastSeasonChange", "mediaAddedAt", "serviceId",
        "serviceId4k", "externalServiceId", "externalServiceId4k",
        "externalServiceSlug", "externalServiceSlug4k",
        "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k"
      FROM "media"`
    );

    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`ALTER TABLE "temporary_media" RENAME TO "media"`);

    await queryRunner.query(
      `CREATE INDEX "IDX_7ff2d11f6a83cb52386eaebe74" ON "media" ("imdbId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a289eb1fa489c1bc6f38d9c3" ON "media" ("tvdbId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5" ON "media" ("tmdbId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_mbid" ON "media" ("mbId")`
    );

    await queryRunner.query(
      `CREATE TABLE "metadata_album" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mbAlbumId" varchar NOT NULL,
        "caaUrl" varchar NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_metadata_album_mbAlbumId" ON "metadata_album" ("mbAlbumId")`
    );

    await queryRunner.query(
      `CREATE TABLE "metadata_artist" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mbArtistId" varchar NOT NULL,
        "tmdbPersonId" varchar,
        "tmdbThumb" varchar,
        "tmdbUpdatedAt" datetime,
        "tadbThumb" varchar,
        "tadbCover" varchar,
        "tadbUpdatedAt" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
      )`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_metadata_artist_mbArtistId" ON "metadata_artist" ("mbArtistId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_metadata_album_mbAlbumId"`);
    await queryRunner.query(`DROP TABLE "metadata_album"`);

    await queryRunner.query(`DROP INDEX "IDX_metadata_artist_mbArtistId"`);
    await queryRunner.query(`DROP TABLE "metadata_artist"`);

    await queryRunner.query(`DROP INDEX "IDX_watchlist_mbid"`);
    await queryRunner.query(`DROP INDEX "IDX_media_mbid"`);

    await queryRunner.query(
      `CREATE TABLE "temporary_watchlist" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "ratingKey" varchar NOT NULL,
        "mediaType" varchar NOT NULL,
        "title" varchar NOT NULL,
        "tmdbId" integer NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "requestedById" integer,
        "mediaId" integer,
        CONSTRAINT "UNIQUE_USER_DB" UNIQUE ("tmdbId", "requestedById"),
        CONSTRAINT "FK_ae34e6b153a90672eb9dc4857d7" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_6641da8d831b93dfcb429f8b8bc" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`
    );

    await queryRunner.query(
      `INSERT INTO "temporary_watchlist"
      SELECT "id", "ratingKey", "mediaType", "title", "tmdbId",
             "createdAt", "updatedAt", "requestedById", "mediaId"
      FROM "watchlist" WHERE "mediaType" != 'music'`
    );

    await queryRunner.query(`DROP TABLE "watchlist"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_watchlist" RENAME TO "watchlist"`
    );

    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "musicQuotaLimit"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "musicQuotaDays"`);
  }
}
