import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScheduleTargetType, WelcomeTriggerType } from '@tunefour/shared-types';
import { Device } from './device.entity';
import { Office } from './office.entity';

/**
 * A guest greeting shown on a screen. It can be scheduled ahead of time or
 * triggered live from the front-desk view. At playback it occupies the top
 * "interrupt" layer of the manifest, then reverts to normal content.
 *
 * Targets an office or a single device (the target-type enum is shared with
 * Schedule; the "group" value is unused here).
 */
@Entity('welcome_messages')
export class WelcomeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Object.values(ScheduleTargetType) })
  targetType: ScheduleTargetType;

  @ManyToOne(() => Office, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'officeId' })
  office: Office | null;

  @Column({ type: 'uuid', nullable: true })
  officeId: string | null;

  @ManyToOne(() => Device, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Device | null;

  @Column({ type: 'uuid', nullable: true })
  deviceId: string | null;

  /** Message template, e.g. "Welcome, {company}". */
  @Column({ type: 'text' })
  template: string;

  /** Values substituted into the template, e.g. { "company": "Acme" }. */
  @Column({ type: 'jsonb', nullable: true })
  variables: Record<string, string> | null;

  @Column({ type: 'enum', enum: Object.values(WelcomeTriggerType) })
  triggerType: WelcomeTriggerType;

  /** Window for scheduled greetings; null for live triggers. */
  @Column({ type: 'timestamptz', nullable: true })
  scheduledStart: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledEnd: Date | null;

  @Column({ type: 'int' })
  durationSec: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
