import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeviceStatus, EnrollmentState, Orientation } from '@tunefour/shared-types';
import { Office } from './office.entity';
import { DeviceGroup } from './device-group.entity';
import { DeviceCredential } from './device-credential.entity';

/**
 * One mini-PC + TV. Belongs to exactly one office, and may belong to many
 * device groups (for content targeting).
 *
 * Two status-like fields answer different questions:
 *  - `status` is live connectivity (is it online right now).
 *  - `enrollmentState` is the provisioning lifecycle (enrolled / revoked).
 */
@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Office, (office) => office.devices, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'officeId' })
  office: Office;

  @Index()
  @Column({ type: 'uuid' })
  officeId: string;

  @Column({ type: 'text' })
  name: string;

  /** e.g. "1920x1080"; null until the client reports it. */
  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @Column({ type: 'enum', enum: Object.values(Orientation), default: Orientation.Landscape })
  orientation: Orientation;

  /** Screen rotation in degrees: 0, 90, 180, or 270. */
  @Column({ type: 'int', default: 0 })
  rotation: number;

  @Column({ type: 'enum', enum: Object.values(DeviceStatus), default: DeviceStatus.Unenrolled })
  status: DeviceStatus;

  @Column({
    type: 'enum',
    enum: Object.values(EnrollmentState),
    default: EnrollmentState.Pending,
  })
  enrollmentState: EnrollmentState;

  /** Updated by the device heartbeat (Phase 3). */
  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  /** The manifest version the device reports it is currently running. */
  @Column({ type: 'text', nullable: true })
  currentManifestVersion: string | null;

  @Column({ type: 'text', nullable: true })
  appVersion: string | null;

  @ManyToMany(() => DeviceGroup, (group) => group.devices)
  groups: DeviceGroup[];

  @OneToMany(() => DeviceCredential, (credential) => credential.device)
  credentials: DeviceCredential[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
