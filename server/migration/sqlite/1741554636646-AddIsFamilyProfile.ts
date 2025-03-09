import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsFamilyProfile1741554636646 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'isFamilyProfile',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'isFamilyProfile');
  }
}
