import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlaylistItem } from './playlist-item.entity';

/**
 * An ordered loop of content. A Playlist describes *what* plays and in what
 * order; a Schedule describes *when and where* a playlist runs. They are kept
 * separate on purpose so one playlist can be reused across many schedules.
 */
@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  /** The ordered items in the loop. Cascades so items save/remove with the playlist. */
  @OneToMany(() => PlaylistItem, (item) => item.playlist, { cascade: true })
  items: PlaylistItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
