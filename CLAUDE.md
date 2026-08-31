# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Tunefour** — a server–client digital signage platform. Client apps run on mini PCs
(one per TV) across ~30 offices (~90 devices, single organization) and display ads,
notices, and welcome messages. The cloud server tells each client what to show and
provides an admin portal for user management and content scheduling.

Full design lives in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) — read it before
making architectural changes.

## Two hard requirements (do not regress)

1. **Fail-safe.** A screen must keep showing correct content through server outages,
   network loss, and OS reboots. Clients are **offline-first**: they cache their full
   schedule locally and play from cache with zero connectivity. Never let a failure
   produce a blank/error screen — always fall back to the branded fallback screen.
2. **Secure by design.** TLS/WSS everywhere; per-device scoped credentials; signed,
   short-lived media URLs + checksum verification; user-authored HTML rendered only in a
   sandboxed iframe with strict CSP.

## Tech stack

- **Server:** Node.js + TypeScript, **NestJS** (REST API + WebSocket gateway).
- **Admin portal / front-desk:** **Next.js**.
- **Client:** **Electron/Chromium** kiosk on **Windows 11 Pro**.
- **Data:** Postgres (state), Redis (WS pub/sub fan-out + cache), object storage + CDN (media).
- **Monorepo:** pnpm workspaces + Turborepo. TypeScript strict mode.

## Planned repo layout

```
apps/server     NestJS API + WebSocket gateway
apps/admin      Next.js admin portal
apps/frontdesk  Next.js front-desk view (scoped welcome-message sender)
apps/client     Electron kiosk + Windows watchdog/provisioning
packages/shared-types   DTOs + manifest schema shared across apps
packages/auth           AuthProvider interface + Local (+ later OIDC/Keycloak)
packages/config         shared lint/tsconfig/build config
infra/          IaC (Terraform), Dockerfiles, deployment manifests
```

## Workflow: design before code (IMPORTANT)

**Before writing code for any new phase, feature, or non-trivial change, first write a
technical design document in HTML under `docs/`** and get it reviewed/approved before
implementing. Match the style of the existing docs (e.g. `docs/tech-stack.html`). The doc
should cover the approach, key decisions/trade-offs, data/interfaces affected, and links to
references. Add a row for each new doc to `docs/README.md`. Skip this only for trivial edits
(typos, formatting, dependency bumps) where there's nothing to design.

## Conventions & things to respect

- **Auth is pluggable.** Admin auth goes through the `AuthProvider` interface in
  `packages/auth`. MVP uses `LocalAuthProvider` (Argon2 + JWT). Keycloak/OIDC must be
  addable as a new provider **without touching the rest of the app** — keep it decoupled.
- **Sync model is desired-state.** The server computes a versioned per-device **manifest**;
  the client reconciles toward it (download → verify checksum → atomic swap → rollback on
  failure). Don't add imperative "push individual file" flows that bypass this.
- **RBAC roles:** super-admin, content-editor, office-manager, front-desk, viewer. The
  `front-desk` role can *only* send welcome messages to its own office.
- **Playlist vs Schedule are separate on purpose.** Playlist = ordered content loop;
  Schedule = when/where a playlist runs (with per-office timezone). Don't merge them.
- **Timezone is first-class.** All dayparting/scheduling resolves in the office's local time.
- Shared types live in `packages/shared-types` — don't duplicate DTOs per app.

## Windows 11 Pro client (IMPORTANT)

The client OS is **Windows 11 Pro**, which gives us OS-level kiosk lockdown and update
control. Use **Assigned Access / kiosk mode** to lock the device to the Electron app,
**Group Policy + Windows Update for Business** to schedule OS updates/reboots outside
business hours, and optionally **MDM/Intune** for central management. Reboots are therefore
controllable — but keep **offline-first + auto-login + auto-launch + watchdog** as
defense-in-depth so the app auto-recovers to signage regardless. Keep OS config in a
repeatable provisioning script (data, not hard-coded); the app must never *depend* on OS
policy to stay fail-safe. See §7 of the implementation plan.

## Status

Greenfield — only `IMPLEMENTATION_PLAN.md` exists so far. MVP = Phases 0–7 of the plan.
Build commands, test commands, and run instructions will be added here as the monorepo
scaffolding lands (Phase 0).
