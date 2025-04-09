import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class UserPushSubscription {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, (user) => user.pushSubscriptions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public user: User;

  @Column()
  public endpoint: string;

  @Column()
  public p256dh: string;

  @Column()
  public auth: string;

  @Column({ nullable: true })
  public userAgent: string;

  @CreateDateColumn({ nullable: true })
  public createdAt: Date;

  constructor(init?: Partial<UserPushSubscription>) {
    Object.assign(this, init);
  }
}
