import type { MigrationInterface, QueryRunner } from 'typeorm';
import { TableUnique } from 'typeorm';

export class DropImdbIdConstraint1607928251245 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint(
      'media',
      'UQ_7ff2d11f6a83cb52386eaebe74b'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createUniqueConstraint(
      'media',
      new TableUnique({
        name: 'UQ_7ff2d11f6a83cb52386eaebe74b',
        columnNames: ['imdbId'],
      })
    );
  }
}
