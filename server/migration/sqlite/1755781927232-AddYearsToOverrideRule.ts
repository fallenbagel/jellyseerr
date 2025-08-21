import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddYearsToOverrideRule1755781927232 implements MigrationInterface {
  name = 'AddYearsToOverrideRule1755781927232';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "override_rule" ADD COLUMN "years" varchar`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "override_rule" DROP COLUMN "years"`);
  }
}
