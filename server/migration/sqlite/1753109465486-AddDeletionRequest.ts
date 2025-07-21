import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletionRequest1753109465486 implements MigrationInterface {
  name = 'AddDeletionRequest1753109465486';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "deletion_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "is4k" boolean NOT NULL DEFAULT (0), "reason" text, "mediaId" integer, "requestedById" integer, "modifiedById" integer, CONSTRAINT "FK_deletion_request_media" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_deletion_request_requestedBy" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_deletion_request_modifiedBy" FOREIGN KEY ("modifiedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deletion_request_media" ON "deletion_request" ("mediaId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deletion_request_requestedBy" ON "deletion_request" ("requestedById")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_deletion_request_requestedBy"`);
    await queryRunner.query(`DROP INDEX "IDX_deletion_request_media"`);
    await queryRunner.query(`DROP TABLE "deletion_request"`);
  }
}