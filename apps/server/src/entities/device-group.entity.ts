import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Device } from './device.entity';

/**
 * A tag-based grouping of devices used to target content at many screens at
 * once (e.g. "All lobby screens"). Groups are organization-wide and may span
 * offices. The relationship to Device is many-to-many.
 */
@Entity('device_groups')
export class DeviceGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @ManyToMany(() => Device, (device) => device.groups)
  @JoinTable({ name: 'device_group_devices' })
  devices: Device[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
