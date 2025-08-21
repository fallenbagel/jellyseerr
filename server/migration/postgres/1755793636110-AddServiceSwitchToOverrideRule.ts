import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceSwitchToOverrideRule1755793636110
  implements MigrationInterface
{
  name = 'AddServiceSwitchToOverrideRule1755793636110';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "override_rule" ADD COLUMN "serviceSwitch" varchar`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "override_rule" DROP COLUMN "serviceSwitch"`
    );
  }
}
