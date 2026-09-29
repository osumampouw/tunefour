import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { User } from './user.entity';

/**
 * A physical office location. Owns the devices installed there, and any
 * office-scoped users (e.g. an office-manager or front-desk operator).
 *
 * The timezone is first-class: all content dayparting/scheduling resolves in
 * this office's local time.
 */
@Entity('offices')
export class Office {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  /** IANA timezone identifier, e.g. "Asia/Jakarta". */
  @Column({ type: 'text' })
  timezone: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @OneToMany(() => Device, (device) => device.office)
  devices: Device[];

  @OneToMany(() => User, (user) => user.office)
  users: User[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
