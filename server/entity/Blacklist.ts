import { MediaStatus, type MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { User } from '@server/entity/User';
import type { BlacklistItem } from '@server/interfaces/api/blacklistInterfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { ZodNumber, ZodOptional, ZodString } from 'zod';

@Entity()
@Unique(['tmdbId', 'mbId'])
export class Blacklist implements BlacklistItem {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public mediaType: MediaType;

  @Column({ nullable: true, type: 'varchar' })
  title?: string;

  @Column({ nullable: true })
  @Index()
  public tmdbId?: number;

  @Column({ nullable: true })
  @Index()
  public mbId?: string;

  @ManyToOne(() => User, (user) => user.id, {
    eager: true,
  })
  user: User;

  @OneToOne(() => Media, (media) => media.blacklist, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public media: Media;

  @CreateDateColumn()
  public createdAt: Date;

  constructor(init?: Partial<Blacklist>) {
    Object.assign(this, init);
  }

  public static async addToBlacklist({
    blacklistRequest,
  }: {
    blacklistRequest: {
      mediaType: MediaType;
      title?: ZodOptional<ZodString>['_output'];
      tmdbId?: ZodNumber['_output'];
      mbId?: ZodOptional<ZodString>['_output'];
    };
  }): Promise<void> {
    const blacklist = new this({
      ...blacklistRequest,
    });

    const mediaRepository = getRepository(Media);
    let media = await mediaRepository.findOne({
      where:
        blacklistRequest.mediaType === 'music'
          ? { mbId: blacklistRequest.mbId }
          : { tmdbId: blacklistRequest.tmdbId },
    });

    const blacklistRepository = getRepository(this);

    await blacklistRepository.save(blacklist);

    if (!media) {
      media = new Media({
        tmdbId: blacklistRequest.tmdbId,
        mbId: blacklistRequest.mbId,
        status: MediaStatus.BLACKLISTED,
        status4k: MediaStatus.BLACKLISTED,
        mediaType: blacklistRequest.mediaType,
        blacklist: Promise.resolve(blacklist),
      });

      await mediaRepository.save(media);
    } else {
      media.blacklist = Promise.resolve(blacklist);
      media.status = MediaStatus.BLACKLISTED;
      media.status4k = MediaStatus.BLACKLISTED;

      await mediaRepository.save(media);
    }
  }
}
