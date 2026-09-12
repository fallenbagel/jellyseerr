import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWatchlistMetadata1789200000000 implements MigrationInterface {
  name = 'AddWatchlistMetadata1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "posterPath" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "backdropPath" character varying`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "overview" text`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "releaseDate" character varying`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "genreIds" text`);
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "studioIds" text`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "originalLanguage" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "certification" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "tmdbStatus" character varying`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "runtime" integer`);
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "voteAverage" real`);
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "voteCount" integer`);
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "popularity" real`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "watchProviders" text`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "watchProviderRegions" text`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "metadataUpdatedAt" timestamp with time zone`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_watchlist_release_date" ON "watchlist" ("releaseDate")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_watchlist_release_date"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "metadataUpdatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "watchProviderRegions"`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "watchProviders"`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "popularity"`);
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "voteCount"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "voteAverage"`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "runtime"`);
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "tmdbStatus"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "certification"`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "originalLanguage"`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "studioIds"`);
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "genreIds"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "releaseDate"`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "overview"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "backdropPath"`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "posterPath"`);
  }
}
