/** Core enums shared across server, admin, front-desk, and client. */

export const AssetType = {
  Image: 'image',
  Video: 'video',
  Html: 'html',
  Url: 'url',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

/** Transition effect played between playlist items. */
export const Transition = {
  None: 'none',
  Fade: 'fade',
} as const;
export type Transition = (typeof Transition)[keyof typeof Transition];

export const DeviceStatus = {
  Online: 'online',
  Offline: 'offline',
  Unenrolled: 'unenrolled',
} as const;
export type DeviceStatus = (typeof DeviceStatus)[keyof typeof DeviceStatus];

export const Orientation = {
  Landscape: 'landscape',
  Portrait: 'portrait',
} as const;
export type Orientation = (typeof Orientation)[keyof typeof Orientation];

/** When a schedule window ends mid-item: finish the current item or hard-cut. */
export const BoundaryPolicy = {
  Finish: 'finish',
  HardCut: 'hardcut',
} as const;
export type BoundaryPolicy = (typeof BoundaryPolicy)[keyof typeof BoundaryPolicy];

export const Role = {
  SuperAdmin: 'super-admin',
  ContentEditor: 'content-editor',
  OfficeManager: 'office-manager',
  FrontDesk: 'front-desk',
  Viewer: 'viewer',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Real-time commands the server can push to a client over WSS. */
export const DeviceCommand = {
  ManifestUpdated: 'manifest-updated',
  ShowWelcome: 'show-welcome',
  Reboot: 'reboot',
  Refresh: 'refresh',
  ClearCache: 'clear-cache',
  Screenshot: 'screenshot',
  TakeOffline: 'take-offline',
} as const;
export type DeviceCommand = (typeof DeviceCommand)[keyof typeof DeviceCommand];
