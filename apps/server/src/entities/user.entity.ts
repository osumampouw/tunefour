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
 *
 * Authentication is delegated to Google SSO (OpenID Connect) — we store no
 * passwords. This row is the access allowlist: a person can sign in only if an
 * active row exists for their email. See docs/phase1-auth-rbac.html.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  email: string;

  /**
   * The identity provider's stable per-account id (Google's `sub` claim),
   * captured on first successful sign-in. Null until the user signs in once.
   * Used for audit and robust account linking; the allowlist still matches by
   * email in this phase.
   */
  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  externalId: string | null;

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
