import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIssues1634904083966 implements MigrationInterface {
  name = 'AddIssues1634904083966';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueType" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "problemSeason" integer NOT NULL DEFAULT (0), "problemEpisode" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "createdById" integer, "modifiedById" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "issue_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "issueId" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueType" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "problemSeason" integer NOT NULL DEFAULT (0), "problemEpisode" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "createdById" integer, "modifiedById" integer, CONSTRAINT "FK_276e20d053f3cff1645803c95d8" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_10b17b49d1ee77e7184216001e0" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_da88a1019c850d1a7b143ca02e5" FOREIGN KEY ("modifiedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_issue"("id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById") SELECT "id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById" FROM "issue"`
    );
    await queryRunner.query(`DROP TABLE "issue"`);
    await queryRunner.query(`ALTER TABLE "temporary_issue" RENAME TO "issue"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_issue_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "issueId" integer, CONSTRAINT "FK_707b033c2d0653f75213614789d" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_180710fead1c94ca499c57a7d42" FOREIGN KEY ("issueId") REFERENCES "issue" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_issue_comment"("id", "message", "createdAt", "updatedAt", "userId", "issueId") SELECT "id", "message", "createdAt", "updatedAt", "userId", "issueId" FROM "issue_comment"`
    );
    await queryRunner.query(`DROP TABLE "issue_comment"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_issue_comment" RENAME TO "issue_comment"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "issue_comment" RENAME TO "temporary_issue_comment"`
    );
    await queryRunner.query(
      `CREATE TABLE "issue_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "issueId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "issue_comment"("id", "message", "createdAt", "updatedAt", "userId", "issueId") SELECT "id", "message", "createdAt", "updatedAt", "userId", "issueId" FROM "temporary_issue_comment"`
    );
    await queryRunner.query(`DROP TABLE "temporary_issue_comment"`);
    await queryRunner.query(`ALTER TABLE "issue" RENAME TO "temporary_issue"`);
    await queryRunner.query(
      `CREATE TABLE "issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueType" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "problemSeason" integer NOT NULL DEFAULT (0), "problemEpisode" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "createdById" integer, "modifiedById" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "issue"("id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById") SELECT "id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById" FROM "temporary_issue"`
    );
    await queryRunner.query(`DROP TABLE "temporary_issue"`);
    await queryRunner.query(`DROP TABLE "issue_comment"`);
    await queryRunner.query(`DROP TABLE "issue"`);
  }
}
