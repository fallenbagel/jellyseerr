import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNullFields1734809898562 implements MigrationInterface {
  name = 'FixNullFields1734809898562';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP CONSTRAINT "FK_6641da8d831b93dfcb429f8b8bc"`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ALTER COLUMN "mediaId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ALTER COLUMN "mediaId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "season" DROP CONSTRAINT "FK_087099b39600be695591da9a49c"`
    );
    await queryRunner.query(
      `ALTER TABLE "season" ALTER COLUMN "mediaId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD CONSTRAINT "FK_6641da8d831b93dfcb429f8b8bc" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "season" ADD CONSTRAINT "FK_087099b39600be695591da9a49c" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "season" DROP CONSTRAINT "FK_087099b39600be695591da9a49c"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0"`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP CONSTRAINT "FK_6641da8d831b93dfcb429f8b8bc"`
    );
    await queryRunner.query(
      `ALTER TABLE "season" ALTER COLUMN "mediaId" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "season" ADD CONSTRAINT "FK_087099b39600be695591da9a49c" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ALTER COLUMN "mediaId" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ALTER COLUMN "mediaId" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD CONSTRAINT "FK_6641da8d831b93dfcb429f8b8bc" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
