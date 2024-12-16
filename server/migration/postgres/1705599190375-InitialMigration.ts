import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1705599190375 implements MigrationInterface {
  name = 'InitialMigration1705599190375';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table if not exists session
       (
         "expiredAt" bigint,
         id          text,
         json        text
       );`
    );
    await queryRunner.query(
      `create index if not exists "idx_194703_IDX_28c5d1d16da7908c97c9bc2f74"
        on session ("expiredAt");`
    );
    await queryRunner.query(
      `create unique index if not exists idx_194703_sqlite_autoindex_session_1
        on session (id);`
    );
    await queryRunner.query(
      `create table if not exists media
       (
         id                      serial,
         "mediaType"             text,
         "tmdbId"                int,
         "tvdbId"                int,
         "imdbId"                text,
         status                  int default '1'::int,
         status4k                int default '1'::int,
         "createdAt"             timestamp with time zone default CURRENT_TIMESTAMP,
         "updatedAt"             timestamp with time zone default CURRENT_TIMESTAMP,
         "lastSeasonChange"      timestamp with time zone default CURRENT_TIMESTAMP,
         "mediaAddedAt"          timestamp with time zone,
         "serviceId"             int,
         "serviceId4k"           int,
         "externalServiceId"     int,
         "externalServiceId4k"   int,
         "externalServiceSlug"   text,
         "externalServiceSlug4k" text,
         "ratingKey"             text,
         "ratingKey4k"           text,
         "jellyfinMediaId"       text,
         "jellyfinMediaId4k"     text,
         constraint idx_194722_media_pkey
           primary key (id)
       );`
    );
    await queryRunner.query(
      `create table if not exists season
       (
         id             serial,
         "seasonNumber" int,
         status         int default '1'::int,
         "createdAt"    timestamp with time zone  default CURRENT_TIMESTAMP,
         "updatedAt"    timestamp with time zone  default CURRENT_TIMESTAMP,
         "mediaId"      int not null,
         status4k       int default '1'::int,
         constraint idx_194715_season_pkey
           primary key (id),
         foreign key ("mediaId") references media
           on delete cascade
       );`
    );
    await queryRunner.query(
      `create index if not exists "idx_194722_IDX_7ff2d11f6a83cb52386eaebe74"
        on media ("imdbId");`
    );
    await queryRunner.query(
      `create index if not exists "idx_194722_IDX_41a289eb1fa489c1bc6f38d9c3"
        on media ("tvdbId");`
    );
    await queryRunner.query(
      `create index if not exists "idx_194722_IDX_7157aad07c73f6a6ae3bbd5ef5"
        on media ("tmdbId");`
    );
    await queryRunner.query(
      `create unique index if not exists idx_194722_sqlite_autoindex_media_1
        on media ("tvdbId");`
    );
    await queryRunner.query(
      `create table if not exists "user"
       (
         id                           serial,
         email                        text,
         username                     text,
         "plexId"                     int,
         "plexToken"                  text,
         permissions                  int default '0'::int,
         avatar                       text,
         "createdAt"                  timestamp with time zone  default CURRENT_TIMESTAMP,
         "updatedAt"                  timestamp with time zone  default CURRENT_TIMESTAMP,
         password                     text,
         "userType"                   int default '1'::int,
         "plexUsername"               text,
         "resetPasswordGuid"          text,
         "recoveryLinkExpirationDate" date,
         "movieQuotaLimit"            int,
         "movieQuotaDays"             int,
         "tvQuotaLimit"               int,
         "tvQuotaDays"                int,
         "jellyfinUsername"           text,
         "jellyfinAuthToken"          text,
         "jellyfinUserId"             text,
         "jellyfinDeviceId"           text,
         constraint idx_194731_user_pkey
           primary key (id)
       );`
    );
    await queryRunner.query(
      `create unique index if not exists idx_194731_sqlite_autoindex_user_1
        on "user" (email);`
    );
    await queryRunner.query(
      `create table if not exists user_push_subscription
       (
         id       serial,
         endpoint text,
         p256dh   text,
         auth     text,
         "userId" int,
         constraint idx_194740_user_push_subscription_pkey
           primary key (id),
         foreign key ("userId") references "user"
           on delete cascade
       );`
    );
    await queryRunner.query(
      `create unique index if not exists idx_194740_sqlite_autoindex_user_push_subscription_1
        on user_push_subscription (auth);`
    );
    await queryRunner.query(
      `create table if not exists issue
       (
         id               serial,
         "issueType"      int,
         status           int default '1'::int,
         "problemSeason"  int default '0'::int,
         "problemEpisode" int default '0'::int,
         "createdAt"      timestamp with time zone  default CURRENT_TIMESTAMP,
         "updatedAt"      timestamp with time zone  default CURRENT_TIMESTAMP,
         "mediaId"        int not null,
         "createdById"    int,
         "modifiedById"   int,
         constraint idx_194747_issue_pkey
           primary key (id),
         foreign key ("modifiedById") references "user"
           on delete cascade,
         foreign key ("createdById") references "user"
           on delete cascade,
         foreign key ("mediaId") references media
           on delete cascade
       );`
    );
    await queryRunner.query(
      `create table if not exists issue_comment
       (
         id          serial,
         message     text,
         "createdAt" timestamp with time zone default CURRENT_TIMESTAMP,
         "updatedAt" timestamp with time zone default CURRENT_TIMESTAMP,
         "userId"    int,
         "issueId"   int,
         constraint idx_194755_issue_comment_pkey
           primary key (id),
         foreign key ("issueId") references issue
           on delete cascade,
         foreign key ("userId") references "user"
           on delete cascade
       );`
    );
    await queryRunner.query(
      `create table if not exists user_settings
       (
           id                         serial,
           "notificationTypes"        text,
           "discordId"                text,
           "userId"                   int,
           region                     text,
           "originalLanguage"         text,
           "telegramChatId"           text,
           "telegramSendSilently"     boolean,
           "pgpKey"                   text,
           locale                     text default ''::text,
           "pushbulletAccessToken"    text,
           "pushoverApplicationToken" text,
           "pushoverUserKey"          text,
           "watchlistSyncMovies"      boolean,
           "watchlistSyncTv"          boolean,
           "pushoverSound"            varchar,
           constraint idx_194762_user_settings_pkey
               primary key (id),
           foreign key ("userId") references "user"
               on delete cascade
       );`
    );
    await queryRunner.query(
      `create unique index if not exists idx_194762_sqlite_autoindex_user_settings_1
        on user_settings ("userId");`
    );
    await queryRunner.query(
      `create table if not exists media_request
       (
         id                  serial,
         status              int,
         "createdAt"         timestamp with time zone  default CURRENT_TIMESTAMP,
         "updatedAt"         timestamp with time zone  default CURRENT_TIMESTAMP,
         type                text,
         "mediaId"           int not null,
         "requestedById"     int,
         "modifiedById"      int,
         is4k                boolean default false,
         "serverId"          int,
         "profileId"         int,
         "rootFolder"        text,
         "languageProfileId" int,
         tags                text,
         "isAutoRequest"     boolean default false,
         constraint idx_194770_media_request_pkey
           primary key (id),
         foreign key ("modifiedById") references "user"
           on delete set null,
         foreign key ("requestedById") references "user"
           on delete cascade,
         foreign key ("mediaId") references media
           on delete cascade
       );`
    );
    await queryRunner.query(
      `create table if not exists season_request
       (
         id             serial NOT NULL,
         "seasonNumber" int,
         status         int                      default '1'::int,
         "createdAt"    timestamp with time zone default now(),
         "updatedAt"    timestamp with time zone default now(),
         "requestId"    int,
         constraint idx_194709_season_request_pkey
           primary key (id),
         foreign key ("requestId") references media_request
           on delete cascade
       );`
    );
    await queryRunner.query(
      `create table if not exists discover_slider
       (
         id          serial,
         type        integer,
         "order"     integer,
         "isBuiltIn" boolean default false,
         enabled     boolean default true,
         title       text,
         data        text,
         "createdAt" timestamp with time zone default CURRENT_TIMESTAMP,
         "updatedAt" timestamp with time zone default CURRENT_TIMESTAMP,
         constraint idx_194779_discover_slider_pkey
           primary key (id)
       );`
    );
    await queryRunner.query(
      `create table if not exists watchlist
       (
         id              serial,
         "ratingKey"     text,
         "mediaType"     text,
         title           text,
         "tmdbId"        int,
         "createdAt"     timestamp with time zone default CURRENT_TIMESTAMP,
         "updatedAt"     timestamp with time zone default CURRENT_TIMESTAMP,
         "requestedById" int,
         "mediaId"       int not null,
         constraint idx_194788_watchlist_pkey
           primary key (id)
       );`
    );
    await queryRunner.query(
      `create index if not exists "idx_194788_IDX_939f205946256cc0d2a1ac51a8"
        on watchlist ("tmdbId");`
    );
    await queryRunner.query(
      `create unique index if not exists idx_194788_sqlite_autoindex_watchlist_1
        on watchlist ("tmdbId", "requestedById");`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop table if exists session cascade`);
    await queryRunner.query(`drop table if exists season_request cascade`);
    await queryRunner.query(`drop table if exists season cascade`);
    await queryRunner.query(
      `drop table if exists user_push_subscription cascade`
    );
    await queryRunner.query(`drop table if exists issue_comment cascade`);
    await queryRunner.query(`drop table if exists issue cascade`);
    await queryRunner.query(`drop table if exists user_settings cascade`);
    await queryRunner.query(`drop table if exists media_request cascade`);
    await queryRunner.query(`drop table if exists media cascade`);
    await queryRunner.query(`drop table if exists "user" cascade`);
    await queryRunner.query(`drop table if exists discover_slider cascade`);
    await queryRunner.query(`drop table if exists watchlist cascade`);
  }
}
