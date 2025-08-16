import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlacklistedGenresMovies1755356368591
  implements MigrationInterface
{
  name = 'AddBlacklistedGenresMovies1755356368591';

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
