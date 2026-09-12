import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWatchlistMetadata1789200000000 implements MigrationInterface {
  name = 'AddWatchlistMetadata1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "posterPath" varchar`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "backdropPath" varchar`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "overview" text`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "releaseDate" varchar`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "genreIds" text`);
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "studioIds" text`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "originalLanguage" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "certification" varchar`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" ADD "tmdbStatus" varchar`);
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
      `ALTER TABLE "watchlist" ADD "metadataUpdatedAt" datetime`
    );
    // Existing rows are hydrated lazily by Watchlist.getLocalWatchlist after
    // application settings and TMDB credentials are available.
    await queryRunner.query(
      `CREATE INDEX "IDX_watchlist_release_date" ON "watchlist" ("releaseDate")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_watchlist_release_date"`);
    await queryRunner.dropColumns('watchlist', [
      'metadataUpdatedAt',
      'watchProviderRegions',
      'watchProviders',
      'popularity',
      'voteCount',
      'voteAverage',
      'runtime',
      'tmdbStatus',
      'certification',
      'originalLanguage',
      'studioIds',
      'genreIds',
      'releaseDate',
      'overview',
      'backdropPath',
      'posterPath',
    ]);
  }
}
