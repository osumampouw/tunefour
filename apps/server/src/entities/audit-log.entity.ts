import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * An append-only record of an admin action, for accountability. It keeps a
 * snapshot of the actor's email so the log stays readable even if that user is
 * later deleted (the foreign key is set to null on delete).
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor: User | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  /** Snapshot of the actor's email at the time of the action. */
  @Column({ type: 'text', nullable: true })
  actorEmail: string | null;

  /** What happened, e.g. "device.create". */
  @Column({ type: 'text' })
  action: string;

  /** The kind of thing acted on, e.g. "device". */
  @Column({ type: 'text', nullable: true })
  targetType: string | null;

  /** The id of the thing acted on. */
  @Column({ type: 'text', nullable: true })
  targetId: string | null;

  @Column({ type: 'text', nullable: true })
  ip: string | null;

  /** Extra context about the action. */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
