import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlacklist1730770837441 implements MigrationInterface {
  name = 'AddBlacklist1730770837441';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blacklist"
       (
         "id"        SERIAL PRIMARY KEY,
         "mediaType" VARCHAR   NOT NULL,
         "title"     VARCHAR,
         "tmdbId"    INTEGER   NOT NULL,
         "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
         "userId"    INTEGER,
         "mediaId"   INTEGER,
         CONSTRAINT "UQ_6bbafa28411e6046421991ea21c" UNIQUE ("tmdbId", "userId")
       )`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_6bbafa28411e6046421991ea21" ON "blacklist" ("tmdbId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_6bbafa28411e6046421991ea21"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "blacklist"`);
  }
}
