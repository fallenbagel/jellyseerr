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
    await queryRunner.query(
      `CREATE INDEX "IDX_watchlist_release_date" ON "watchlist" ("releaseDate")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_watchlist_release_date"`);
    await queryRunner.dropColumn('watchlist', 'metadataUpdatedAt');
    await queryRunner.dropColumn('watchlist', 'watchProviderRegions');
    await queryRunner.dropColumn('watchlist', 'watchProviders');
    await queryRunner.dropColumn('watchlist', 'popularity');
    await queryRunner.dropColumn('watchlist', 'voteCount');
    await queryRunner.dropColumn('watchlist', 'voteAverage');
    await queryRunner.dropColumn('watchlist', 'runtime');
    await queryRunner.dropColumn('watchlist', 'tmdbStatus');
    await queryRunner.dropColumn('watchlist', 'certification');
    await queryRunner.dropColumn('watchlist', 'originalLanguage');
    await queryRunner.dropColumn('watchlist', 'studioIds');
    await queryRunner.dropColumn('watchlist', 'genreIds');
    await queryRunner.dropColumn('watchlist', 'releaseDate');
    await queryRunner.dropColumn('watchlist', 'overview');
    await queryRunner.dropColumn('watchlist', 'backdropPath');
    await queryRunner.dropColumn('watchlist', 'posterPath');
  }
}
