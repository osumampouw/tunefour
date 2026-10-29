# Digital Signage Platform — Implementation Plan

## 1. Summary

A server–client digital signage platform:

- **Server (cloud):** NestJS API + real-time gateway, Next.js admin portal, Postgres, Redis, object storage + CDN.
- **Client:** Electron/Chromium kiosk on Windows 11 Home mini PCs, one per TV, offline-first.
- **Scale:** ~30 offices, ~90 devices, single organization.
- **Content:** images, video, HTML/dashboards, dynamic welcome messages.
- **Non-negotiables:** secure by design, fail-safe (a screen keeps working through server outages and OS reboots).

### Key architectural decisions (settled)

| Decision | Choice |
|---|---|
| Backend | Node.js + TypeScript — NestJS (API + WS gateway) |
| Admin portal | Next.js |
| Client | Electron/Chromium kiosk |
| Hosting | Cloud — **GCP** (Cloud Run + Cloud SQL + Memorystore + Cloud Storage/CDN); design stays provider-swappable |
| Tenancy | Single organization (Office → Device → DeviceGroup) |
| Data access | **TypeORM (Data Mapper pattern)** over PostgreSQL — plain-TS entities + repositories (no DSL); see `docs/orm-comparison.html` |
| Admin auth | Local users + RBAC for MVP; **pluggable `AuthProvider`** so Keycloak/OIDC drops in later |
| Client OS | **Windows 11 Pro** (see §7 — enables Assigned Access kiosk, update/reboot control, MDM) |
| Sync model | Server publishes per-device **desired-state manifest**; client reconciles, caches, atomically swaps |
| Welcome messages | One interrupt layer, two triggers: **scheduled ahead** + **on-the-fly** (front-desk view) |

---

## 2. Repository structure (monorepo)

```
tunefour/
├─ apps/
│  ├─ server/        # NestJS API + WebSocket gateway
│  ├─ admin/         # Next.js admin portal
│  ├─ frontdesk/     # Next.js lightweight front-desk view (or a route in admin)
│  └─ client/        # Electron kiosk app + Windows watchdog/provisioning
├─ packages/
│  ├─ shared-types/  # DTOs, manifest schema, enums shared across apps
│  ├─ auth/          # AuthProvider interface + Local + (later) OIDC/Keycloak impls
│  └─ config/        # shared lint/tsconfig/build config
├─ infra/            # IaC (Terraform), Dockerfiles, deployment manifests
└─ docs/             # this plan, API contract, runbooks
```

Tooling: pnpm workspaces + Turborepo, TypeScript strict, ESLint/Prettier, Vitest/Jest, GitHub Actions CI.

---

## 3. Data model (core entities)

```
Office            : id, name, timezone, address
Device            : id, officeId, name, resolution, orientation, rotation,
                    status, lastSeenAt, currentManifestVersion, appVersion,
                    enrollmentState, credentialId
DeviceGroup       : id, name, deviceIds[]  (tag-based targeting)
Asset             : id, type(image|video|html|url), storageKey, checksum(SHA-256),
                    defaultDurationSec, dimensions, metadata
Playlist          : id, name, items[ { assetId, durationSec, transition, order } ]
Schedule          : id, target(device|group|office), playlistId, priority,
                    recurrence, startAt, endAt, daypart, boundaryPolicy(finish|hardcut)
WelcomeMessage    : id, target, template, variables, scheduledWindow?, durationSec,
                    triggerType(scheduled|live)
User / Role       : super-admin | content-editor | office-manager | front-desk | viewer
DeviceCredential  : id, deviceId, type(jwt|cert), issuedAt, expiresAt, revokedAt
AuditLog          : actor, action, target, timestamp, ip, metadata
```

Scheduling resolves into a per-device manifest via three priority layers:
1. Base playlist (always-on) → 2. Scheduled overrides (dayparting) → 3. Interrupts (welcome messages).

---

## 4. Phase plan

Each phase has a clear deliverable and is independently testable. **MVP = Phases 0–7.** Phase 8+ is post-MVP.

> For the recommended Claude Code **model + reasoning effort** to drive each phase, see §11.

### Phase 0 — Foundations & scaffolding
- Monorepo (pnpm + Turborepo), shared tsconfig/eslint, CI pipeline.
- `packages/shared-types` with the manifest schema and core DTOs.
- Local dev: Docker Compose (Postgres + Redis + MinIO as S3-compatible store).
- Baseline IaC skeleton in `infra/` (cloud-agnostic; document the AWS/GCP mapping).
- **Exit:** `pnpm dev` brings up empty API, admin, and a hello-world Electron client.

### Phase 1 — Core server & admin (data + auth + CRUD)
- **TypeORM (Data Mapper)** entities + migrations for all entities in §3 (plain-TS entities +
  repositories; migrations generated then reviewed/hand-corrected as needed).
- **Pluggable auth:** `AuthProvider` interface in `packages/auth` + `GoogleOidcAuthProvider` (Google SSO via OpenID Connect; no passwords — domain + user allowlist, our own JWT access + refresh). Keycloak addable later as the same OIDC provider.
- **RBAC** guards (roles: super-admin, content-editor, office-manager, front-desk, viewer).
- Admin portal: login, and CRUD for Offices, Devices, DeviceGroups, Assets (metadata), Playlists, Schedules.
- Audit logging on all mutations.
- **Exit:** an admin can create offices, devices, playlists, and schedules through the portal.

### Phase 2 — Media pipeline
- Asset upload → object storage; generate SHA-256 checksum; probe dimensions/duration.
- CDN in front of storage; serve media via **short-lived signed URLs**.
- HTML/dashboard assets stored + sanitized on upload; served for sandboxed iframe rendering.
- **Exit:** uploaded media is retrievable via signed URL with a verified checksum.

### Phase 3 — Device enrollment & sync (desired-state manifest)
- **Enrollment flow:** admin issues a one-time enrollment token → device exchanges it for a long-lived device credential (JWT for MVP; mTLS-ready).
- Server computes per-device **manifest** (versioned; assets + signed URLs + checksums + schedule) — see §5 flattening algorithm.
- `GET /device/manifest` with ETag/version; `heartbeat` endpoint (health, current asset, cache/disk, app version).
- Device scoping: a device can read only *its own* manifest and media URLs.
- **Exit:** an enrolled device fetches a correct, scoped manifest; re-fetch is a cheap 304 when unchanged.

### Phase 4 — Client kiosk (offline-first rendering)
- Electron kiosk: fullscreen, per-device resolution/orientation/rotation handling.
- **Local cache** (filesystem + local manifest DB); pre-fetch future assets (resumable); verify checksums.
- **Atomic manifest swap** with rollback; never switch to a partially-downloaded manifest.
- Renderer: image/video/HTML playback, playlist looping, boundary policy (finish vs hard-cut).
- **Graceful degradation — layered fallback (never blank/error):** (1) scheduled content →
  (2) **configurable default fallback image** (per-device, cached locally; delivered via the
  manifest's `fallbackAssetId`) → (3) built-in branded screen → (4) inline `data:`-URI screen
  baked into the client bundle (cannot be missing on disk). A failed asset is skipped; a failed
  page load swaps to the fallback rather than showing a Chromium error page.
- WS→poll fallback for updates.
- **Exit:** device plays its schedule; **pull the network cable and it keeps playing correctly from cache.**

### Phase 5 — Real-time gateway & commands
- **WSS** gateway (NestJS), **Redis pub/sub fan-out** across server instances.
- Push events: `manifest-updated`, `show-welcome`, and commands (`reboot`, `refresh`, `clear-cache`, `screenshot`, `take-offline`). Commands authenticated + idempotent.
- Client WS client with reconnect/backoff; falls back to polling when WS is down.
- **Exit:** an admin action pushes to a live device in <1s; device still functions when WS is unavailable.

### Phase 6 — Welcome messages + Front-desk view
- Welcome message as the **interrupt layer**, two triggers:
  - **Scheduled ahead:** authored in admin (template + target + time window); baked into manifest; reverts after window.
  - **On-the-fly:** "Send welcome now" → live `show-welcome` push → interrupt for a duration → revert.
- **Front-desk view** (`apps/frontdesk` or a scoped admin route):
  - Stripped-down UI: pick a screen in *their own office*, enter guest name/company, send.
  - **`front-desk` RBAC role** — can *only* trigger welcomes to their office; no other admin access.
  - Shows target screen online/offline status; live send = no-op if device offline.
- **Exit:** reception can send an instant welcome to a lobby TV; scheduled welcomes appear and revert automatically.

### Phase 7 — Fail-safe & security hardening (see §6, §7)
- **Windows 11 Pro provisioning** (§7): Assigned Access single-app kiosk (Shell Launcher / kiosk mode), auto-login, Group Policy for update/reboot windows, watchdog service, provisioning script (optionally via MDM/Intune).
- Kiosk hardening: locked-down OS shell, disable devtools/shortcuts, URL allowlist.
- Security: TLS/WSS everywhere, HSTS, CSP on portal + sandboxed iframe for HTML content, input validation, rate limiting, secrets in cloud secret manager, credential rotation/revocation.
- Monitoring dashboard in admin: online/offline, last-seen, current content, storage, error counts + alerting when a device goes dark.
- **Exit (MVP done):** documented failure drills pass (server down, network down, OS reboot, bad asset, revoked device).

### Phase 8+ — Post-MVP
- **Keycloak** as an additional OpenID Connect issuer (roles from Keycloak groups) — a configuration change (issuer + credentials), no app rewrite.
- **mTLS** device certificates (upgrade from JWT).
- **Proof-of-play** analytics + reporting (batched playback logs).
- **Auto-update** via electron-updater with staged rollout.
- Emergency broadcast / all-screens override.
- Optional **MDM/Intune** adoption for central device policy + remote management (Pro supports it).

---

## 5. Schedule-flattening algorithm (server → manifest)

For a given device at time *now* (in the office's timezone):
1. Gather all schedules targeting the device (directly, via group, or via office).
2. Filter to those whose recurrence/window is active now or within the pre-fetch horizon.
3. Sort by priority; higher priority suppresses lower for overlapping time ranges.
4. Layer interrupts (scheduled welcomes) on top.
5. Where no schedule is active → device base playlist → branded fallback.
6. Emit a versioned manifest (content list + durations + signed URLs + checksums + boundary policies). Version = hash of resolved content; unchanged = client gets 304.
- Admin portal warns at save time if a playlist can't fully play within its window, or if schedules conflict.

---

## 6. Fail-safe checklist (cross-cutting)

- Offline-first client; plays a full day from local cache with zero connectivity.
- Pre-fetch + checksum-verify before display; atomic versioned swaps with rollback.
- Graceful degradation → branded fallback, never blank/error.
- Watchdog restarts crashed/frozen kiosk; auto-launch on boot.
- Server HA: stateless replicas behind LB, managed Postgres + read replica + backups, Redis fan-out, CDN so media survives origin outage.
- Monitoring + alerting on device health.
- **Reboots are controllable (Windows 11 Pro): schedule OS updates/reboots outside business hours via Group Policy. Offline-first + watchdog + auto-launch remain as defense-in-depth so any reboot still auto-recovers to signage.**

---

## 7. Windows 11 Pro client hardening (IMPORTANT)

The client OS is **Windows 11 Pro**, which provides the enterprise controls signage relies
on. This shapes the client/provisioning work in Phases 4 & 7 — favourably.

| Pro capability | How we use it |
|---|---|
| **Assigned Access / kiosk mode** (single-app kiosk, Shell Launcher v2) | Lock the device to our Electron kiosk at the OS level — the app *is* the shell; users can't reach the desktop, Explorer, or other apps |
| **Group Policy (`gpedit`) + Local/Domain policy** | Enforce update/reboot windows, disable USB/removable media, restrict shortcuts, lock down the account — centrally repeatable |
| **Windows Update for Business / deferral** | Defer feature & quality updates and **schedule reboots outside business hours** — the forced-mid-display-reboot problem is now controllable |
| **MDM / Entra (Azure AD) join + Intune (optional)** | Central device enrollment, policy push, and remote management if you adopt it later |

Windows resilience stack to build (Phase 7):
- **Kiosk shell:** Assigned Access single-app kiosk pointed at the Electron app (falls back to auto-login + auto-launch if kiosk mode isn't used on a given unit).
- **Auto-login:** dedicated low-privilege kiosk account.
- **Auto-launch + watchdog:** Windows Service/Scheduled Task relaunches the kiosk on exit; watchdog companion restarts Electron on crash/white-screen (heartbeat file). Kept as **defense-in-depth** even though reboots are now controllable.
- **Update/reboot policy:** Windows Update for Business (or GPO) to defer updates and pin reboots to a maintenance window.
- **Provisioning:** a repeatable setup script/GPO template (optionally delivered via MDM/Intune) applied at device setup across the ~90 units.

**Design note:** keep the OS layer abstracted behind the provisioning script so kiosk config
is data, not hard-coded assumptions. Offline-first + watchdog stay regardless of OS
capabilities — the app never *depends* on OS policy to remain fail-safe.

---

## 8. Security summary

- TLS/WSS everywhere; HSTS on portal.
- Device identity via enrollment token → long-lived credential (JWT now, mTLS later); per-device scoping; instant revocation.
- Signed, short-lived media URLs + SHA-256 checksum verification on client.
- Pluggable admin auth (Google SSO via OIDC → Keycloak later) + RBAC + audit log.
- Sandboxed iframe + strict CSP for user-authored HTML content (XSS containment); sanitize on upload.
- Rate limiting, input validation, secrets in cloud secret manager, least-privilege IAM.

---

## 9. Testing & acceptance

- Unit + integration tests per package (Jest/Vitest); API contract tests.
- **Failure-drill suite** (gates MVP): server outage, network loss, OS reboot, partial/corrupt asset download, revoked device, schedule conflict, playlist-longer-than-window boundary.
- E2E: enroll a device → schedule content → verify playback → push live welcome → cut network → verify continuity.

---

## 10. Risks & open items

- **OS update reboots** — now controllable on Windows 11 Pro (schedule outside business hours via Windows Update for Business/GPO); watchdog + offline cache remain as backstop.
- Video storage/bandwidth costs at scale — size CDN + local cache eviction policy.
- Clock/timezone correctness per office — treat office timezone as first-class; NTP on devices.
- HTML content as an XSS vector — enforced sandbox + sanitization is mandatory, not optional.
- Initial provisioning effort per device (90 units) — invest early in a one-shot installer.

---

## 11. Claude Code model & effort per phase

Guidance for which Claude Code **model** and **reasoning effort** to drive each phase with.
The principle: **match capability to risk and novelty.** Escalate to the most capable model
(Opus) for anything security-critical, architecture-defining, or correctness-sensitive where a
subtle bug is expensive; drop to a faster/cheaper model (Sonnet, Haiku) for mechanical,
well-patterned, or repetitive work. These are starting points — if a model stalls or the diff
looks shaky, bump the model/effort up.

Model tiers (Claude Code, current lineup): **Opus** (Opus 5 / 4.8) = most capable, best for hard
reasoning and security; **Sonnet** (Sonnet 5) = balanced default for standard feature work;
**Haiku** (4.5) = fast/cheap for simple, mechanical tasks. Effort scale: low → medium → high →
max. Check/switch the active model with `/model`; **fast mode** (`/fast`, Opus with faster
output) is handy for tight interactive loops.

| Phase | Recommended model | Effort | Why |
|---|---|---|---|
| 0 — Scaffolding | Sonnet | medium | Boilerplate + config; well-patterned, low risk. (Done.) |
| 1 — Data model, **auth**, RBAC, CRUD | **Opus** for auth/RBAC/schema; Sonnet for CRUD | high (auth) / medium (CRUD) | Auth + access control are security-critical; the schema sets long-lived contracts. CRUD around them is routine. |
| 2 — Media pipeline | Sonnet; **Opus** for signed-URL + checksum design | medium / high | Mostly plumbing, but the signed-URL + integrity path is security-sensitive. |
| 3 — Enrollment + desired-state manifest sync | **Opus** | high → max | Architecturally central and security-critical (device credentials, scoping, versioned reconciliation). Get it right once. |
| 4 — Client kiosk (offline-first) | **Opus** | high | Correctness-critical fail-safe logic: atomic swap, rollback, cache, fallback. Subtle bugs = blank screens. |
| 5 — Real-time gateway (WSS + Redis fan-out) | Sonnet; **Opus** for the fan-out/reconnect design | medium / high | Standard gateway code, but distributed delivery + reconnect semantics deserve Opus. |
| 6 — Welcome messages + front-desk view | Sonnet; **Opus** for the interrupt-layer/priority logic | medium / high | Mostly feature/UI work; the interrupt precedence + revert logic is the tricky part. |
| 7 — Fail-safe & security hardening + Windows provisioning | **Opus** | high → max | Highest-stakes phase: hardening, kiosk lockdown, failure drills. Favor thoroughness over speed. |
| 8+ — Post-MVP | varies: **Opus** for Keycloak/OIDC + mTLS; Sonnet for analytics/auto-update; Haiku for mechanical chores | high (security) / medium / low | Match to each item — security extensions get Opus; routine features get Sonnet; simple upkeep gets Haiku. |

Cross-cutting: use **Haiku/low** for mechanical chores (renames, formatting, dependency bumps,
doc tweaks) regardless of phase, and reserve **Opus/max** for anything touching auth, device
credentials, media integrity, or the offline-first fail-safe path.
