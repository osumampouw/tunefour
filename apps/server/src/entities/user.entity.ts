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
import { Role } from '@tunefour/shared-types';
import { Office } from './office.entity';

/**
 * An admin-portal user. The role drives role-based access control. Office-scoped
 * roles (office-manager, front-desk) carry an office; org-wide roles leave it null.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  email: string;

  /** Argon2 hash of the password. The raw password is never stored. */
  @Column({ type: 'text' })
  passwordHash: string;

  @Column({ type: 'enum', enum: Object.values(Role) })
  role: Role;

  @ManyToOne(() => Office, (office) => office.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'officeId' })
  office: Office | null;

  @Column({ type: 'uuid', nullable: true })
  officeId: string | null;

  /** Soft-disable a user without deleting the row. */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
