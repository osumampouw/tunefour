import { Asset } from './asset.entity';
import { AuditLog } from './audit-log.entity';
import { Device } from './device.entity';
import { DeviceCredential } from './device-credential.entity';
import { DeviceGroup } from './device-group.entity';
import { Office } from './office.entity';
import { Playlist } from './playlist.entity';
import { PlaylistItem } from './playlist-item.entity';
import { Schedule } from './schedule.entity';
import { User } from './user.entity';
import { WelcomeMessage } from './welcome-message.entity';

/** Every entity, for registering with TypeORM (DataSource + TypeOrmModule). */
export const entities = [
  Office,
  Device,
  DeviceGroup,
  Asset,
  Playlist,
  PlaylistItem,
  Schedule,
  WelcomeMessage,
  User,
  DeviceCredential,
  AuditLog,
];

export {
  Asset,
  AuditLog,
  Device,
  DeviceCredential,
  DeviceGroup,
  Office,
  Playlist,
  PlaylistItem,
  Schedule,
  User,
  WelcomeMessage,
};
