import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetType } from '@tunefour/shared-types';

/**
 * A single piece of content: an image, a video, a block of HTML, or an
 * external URL. The media bytes live in object storage; this row holds the
 * metadata plus the storage key and checksum used to fetch and verify them.
 */
@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Object.values(AssetType) })
  type: AssetType;

  @Column({ type: 'text' })
  name: string;

  /**
   * Object locator — the path/name of the object within the storage bucket
   * where the media bytes live. This is just a pointer to the bytes, not an
   * access credential: read/write access is controlled separately (the server
   * uses its own storage permissions; clients get short-lived signed read-only
   * URLs). Null for the `url` asset type.
   */
  @Column({ type: 'text', nullable: true })
  storageLocator: string | null;

  /** External URL. Used for the `url` asset type. */
  @Column({ type: 'text', nullable: true })
  url: string | null;

  /** SHA-256 hex digest of the bytes, used for integrity verification. */
  @Column({ type: 'text', nullable: true })
  checksum: string | null;

  /** Default number of seconds this asset is shown for. */
  @Column({ type: 'int' })
  defaultDurationSec: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  /** Open-ended extra data (e.g. codec, original filename). */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
