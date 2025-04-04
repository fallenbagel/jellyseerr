import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
class OverrideRule {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'int', nullable: true })
  public radarrServiceId?: number;

  @Column({ type: 'int', nullable: true })
  public sonarrServiceId?: number;

  @Column({ type: 'int', nullable: true })
  public lidarrServiceId?: number;

  @Column({ nullable: true })
  public users?: string;

  @Column({ nullable: true })
  public genre?: string;

  @Column({ nullable: true })
  public language?: string;

  @Column({ nullable: true })
  public keywords?: string;

  @Column({ type: 'int', nullable: true })
  public profileId?: number;

  @Column({ nullable: true })
  public rootFolder?: string;

  @Column({ nullable: true })
  public tags?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<OverrideRule>) {
    Object.assign(this, init);
  }
}

export default OverrideRule;
