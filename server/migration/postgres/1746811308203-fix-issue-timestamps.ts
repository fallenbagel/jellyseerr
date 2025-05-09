import type { MigrationInterface, QueryRunner } from 'typeorm';

export class fixIssueTimestamps1746811308203 implements MigrationInterface {
  name = 'fixIssueTimestamps1746811308203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" ADD "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "blacklist" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "blacklist" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "season" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "season" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "media" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "media" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "issue" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "issue" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "discover_slider" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "discover_slider" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "discover_slider" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "discover_slider" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discover_slider" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "discover_slider" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "discover_slider" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "discover_slider" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "issue_comment" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "issue" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "issue" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "media" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "media" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "season" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "season" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "blacklist" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "blacklist" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" ADD "createdAt" TIMESTAMP DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "season_request" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "override_rule" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "watchlist" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
  }
}
