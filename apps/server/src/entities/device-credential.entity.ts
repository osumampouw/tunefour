import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CredentialType } from '@tunefour/shared-types';
import { Device } from './device.entity';

/**
 * A per-device credential issued during enrollment (Phase 3). The secret is
 * stored hashed, never in the clear. Credentials can expire and can be revoked
 * instantly by setting `revokedAt`.
 */
@Entity('device_credentials')
export class DeviceCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Device, (device) => device.credentials, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Index()
  @Column({ type: 'uuid' })
  deviceId: string;

  @Column({ type: 'enum', enum: Object.values(CredentialType), default: CredentialType.Jwt })
  type: CredentialType;

  /** Hash of the enrollment secret/token. Never the raw value. */
  @Column({ type: 'text', nullable: true })
  secretHash: string | null;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  /** Null means the credential does not expire. */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  /** Set to revoke the credential immediately. */
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
