import { z } from 'zod';

/**
 * The desired-state manifest: the server's instruction sheet for ONE device.
 * The client reconciles toward this — downloads assets, verifies checksums,
 * then atomically swaps. Validated at runtime on the client (hence zod).
 */

export const ManifestAssetSchema = z.object({
  assetId: z.string().uuid(),
  type: z.enum(['image', 'video', 'html', 'url']),
  /** Short-lived signed URL for media; may be a remote URL for `url` type. */
  url: z.string().url(),
  /** SHA-256 of the asset bytes; client verifies before caching/displaying. */
  checksum: z.string().regex(/^[a-f0-9]{64}$/, 'expected a SHA-256 hex digest'),
  durationSec: z.number().int().positive(),
});
export type ManifestAsset = z.infer<typeof ManifestAssetSchema>;

export const ManifestItemSchema = z.object({
  assetId: z.string().uuid(),
  order: z.number().int().nonnegative(),
  durationSec: z.number().int().positive(),
  transition: z.enum(['none', 'fade']).default('none'),
});
export type ManifestItem = z.infer<typeof ManifestItemSchema>;

/** An interrupt (e.g. a welcome message) that overrides the base loop while active. */
export const ManifestInterruptSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  /** Absolute ISO timestamps in UTC; client compares against synced clock. */
  startAt: z.string().datetime().nullable(),
  endAt: z.string().datetime().nullable(),
  durationSec: z.number().int().positive(),
  priority: z.number().int(),
});
export type ManifestInterrupt = z.infer<typeof ManifestInterruptSchema>;

export const DeviceManifestSchema = z.object({
  deviceId: z.string().uuid(),
  /** Content hash of the resolved manifest; unchanged => client gets a 304. */
  version: z.string(),
  generatedAt: z.string().datetime(),
  timezone: z.string(),
  orientation: z.enum(['landscape', 'portrait']),
  /** All assets referenced below, with signed URLs + checksums to pre-fetch. */
  assets: z.array(ManifestAssetSchema),
  /** The base loop played when no higher-priority schedule/interrupt applies. */
  playlist: z.array(ManifestItemSchema),
  interrupts: z.array(ManifestInterruptSchema).default([]),
  /** Shown when the schedule is empty/expired — never a blank screen. */
  fallbackAssetId: z.string().uuid().nullable(),
});
export type DeviceManifest = z.infer<typeof DeviceManifestSchema>;
