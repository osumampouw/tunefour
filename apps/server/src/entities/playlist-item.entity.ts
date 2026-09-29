import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transition } from '@tunefour/shared-types';
import { Asset } from './asset.entity';
import { Playlist } from './playlist.entity';

/**
 * One slot in a playlist's loop: a reference to an asset, its position in the
 * order, an optional duration override, and the transition into it.
 */
@Entity('playlist_items')
@Index(['playlistId', 'order'])
export class PlaylistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Playlist, (playlist) => playlist.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlistId' })
  playlist: Playlist;

  @Column({ type: 'uuid' })
  playlistId: string;

  @ManyToOne(() => Asset, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'uuid' })
  assetId: string;

  /** Position of this item within the playlist loop (0-based). */
  @Column({ type: 'int' })
  order: number;

  /** Duration override in seconds; null means use the asset's default. */
  @Column({ type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ type: 'enum', enum: Object.values(Transition), default: Transition.None })
  transition: Transition;
}
