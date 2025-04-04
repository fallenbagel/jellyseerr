import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaRequestIsAnimeField1742938382322
  implements MigrationInterface
{
  name = 'AddMediaRequestIsAnimeField1742938382322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "isAnime" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" ADD "userAgent" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" ADD "createdAt" TIMESTAMP DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" DROP CONSTRAINT "UQ_f90ab5a4ed54905a4bb51a7148b"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" ADD CONSTRAINT "UQ_f90ab5a4ed54905a4bb51a7148b" UNIQUE ("auth")`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" DROP COLUMN "userAgent"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "isAnime"`
    );
  }
}
