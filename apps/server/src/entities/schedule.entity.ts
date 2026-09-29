import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoundaryPolicy, ScheduleTargetType } from '@tunefour/shared-types';
import { Device } from './device.entity';
import { DeviceGroup } from './device-group.entity';
import { Office } from './office.entity';
import { Playlist } from './playlist.entity';

/**
 * Assigns a playlist to a target (an office, a device group, or a single
 * device) for a time window, with a priority used to resolve overlaps. This is
 * the primary input to the per-device manifest computation (Phase 3).
 *
 * The target is "polymorphic": exactly one of officeId / deviceGroupId /
 * deviceId is set, matching `targetType`. This is enforced in the service layer
 * (kept as three real foreign keys so database integrity and joins still work).
 */
@Entity('schedules')
@Index(['targetType', 'priority'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Object.values(ScheduleTargetType) })
  targetType: ScheduleTargetType;

  @ManyToOne(() => Office, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'officeId' })
  office: Office | null;

  @Column({ type: 'uuid', nullable: true })
  officeId: string | null;

  @ManyToOne(() => DeviceGroup, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceGroupId' })
  deviceGroup: DeviceGroup | null;

  @Column({ type: 'uuid', nullable: true })
  deviceGroupId: string | null;

  @ManyToOne(() => Device, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Device | null;

  @Column({ type: 'uuid', nullable: true })
  deviceId: string | null;

  @ManyToOne(() => Playlist, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'playlistId' })
  playlist: Playlist;

  @Column({ type: 'uuid' })
  playlistId: string;

  /** Higher priority wins when two schedules overlap in time. */
  @Column({ type: 'int', default: 0 })
  priority: number;

  /** iCalendar RRULE string describing repeats; null means no recurrence. */
  @Column({ type: 'text', nullable: true })
  recurrence: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endAt: Date | null;

  /** Daypart start as local "HH:mm" (resolved in the office timezone). */
  @Column({ type: 'text', nullable: true })
  daypartStart: string | null;

  /** Daypart end as local "HH:mm" (resolved in the office timezone). */
  @Column({ type: 'text', nullable: true })
  daypartEnd: string | null;

  @Column({ type: 'enum', enum: Object.values(BoundaryPolicy), default: BoundaryPolicy.Finish })
  boundaryPolicy: BoundaryPolicy;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
