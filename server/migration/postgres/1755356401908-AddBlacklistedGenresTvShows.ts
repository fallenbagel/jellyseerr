import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlacklistedGenresTvShows1755356401908
  implements MigrationInterface
{
  name = 'AddBlacklistedGenresTvShows1755356401908';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blacklist" DROP COLUMN "blacklistedGenres"`
    );
    await queryRunner.query(
      `ALTER TABLE "blacklist" ADD "blacklistedGenresMovies" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "blacklist" ADD "blacklistedGenresTvShows" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blacklist" DROP COLUMN "blacklistedGenresTvShows"`
    );
    await queryRunner.query(
      `ALTER TABLE "blacklist" DROP COLUMN "blacklistedGenresMovies"`
    );
    await queryRunner.query(
      `ALTER TABLE "blacklist" ADD "blacklistedGenres" character varying`
    );
  }
}
