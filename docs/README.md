# Tunefour Docs

Documentation index for the Tunefour digital signage platform.

## Contents

| Doc | What it covers |
| --- | --- |
| [Introduction](./introduction.html) | Start here. The big picture, a happy-path walkthrough (login → publish content → device enrolls → plays), and a friendly tour of every technology in the stack (TypeScript, pnpm, Turborepo, React, Next.js, NestJS, Electron, Docker, Terraform) with "coming from X" bridges and links to tutorials. **Open in a browser:** `open docs/introduction.html` |
| [Server &amp; NestJS Explained](./server-nestjs.html) | Walkthrough of `apps/server` and NestJS for someone with a Spring background — the Nest↔Spring mapping, the code, `nest-cli.json`, request lifecycle, and why there are multiple `@nestjs/*` packages. **Open in a browser:** `open docs/server-nestjs.html` |
| [Client &amp; Electron Explained](./client-electron.html) | Walkthrough of `apps/client` — Electron's two-process model, `main.ts` (kiosk window, security flags, lifecycle), the fallback `index.html` + CSP, and what later phases add. **Open in a browser:** `open docs/client-electron.html` |
| [Infrastructure, Docker &amp; GCP](./infra.html) | Explains the local dev services (`docker-compose.yml`), `.env.example`, Terraform (later), the local→GCP service mapping, and whether you need Docker/Terraform installed locally. **Open in a browser:** `open docs/infra.html` |
| [ORM / Migration Comparison](./orm-comparison.html) | Decision doc comparing Prisma vs Drizzle vs TypeORM for the NestJS + Postgres server, with a recommendation (Prisma). **Open in a browser:** `open docs/orm-comparison.html` |
| [Phase 1 — Data Model (Design)](./phase1-data-model.html) | The database schema built in Phase 1: entities, columns, relationships, key decisions, and the migration approach. Mirrors `apps/server/src/entities`. **Open in a browser:** `open docs/phase1-data-model.html` |
| [Phase 1 — Auth &amp; RBAC (Design)](./phase1-auth-rbac.html) | How users sign in and what each role may do: authentication delegated to **Google SSO (OpenID Connect)** behind a pluggable provider (Keycloak later), domain + user allowlist provisioning, JWT sessions, the five roles, and office scoping. **Open in a browser:** `open docs/phase1-auth-rbac.html` |
| [Implementation Plan](../IMPLEMENTATION_PLAN.md) | The full architecture, data model, phased build plan (MVP = Phases 0–7), fail-safe & security design, and per-phase Claude model/effort guidance (§11). |
| [CLAUDE.md](../CLAUDE.md) | Project guardrails and conventions for Claude Code (the two hard requirements, stack, repo layout, Windows 11 Pro notes). |

## Suggested reading order

1. **New to the stack?** Start with the [Introduction](./introduction.html) — it includes a
   learning path that matches the build phases.
2. **Ready to build?** Read the [Implementation Plan](../IMPLEMENTATION_PLAN.md), especially the
   phase you're working on.

## Quick start (from the repo root)

```bash
nvm use                   # Node 24 (reads .nvmrc)
pnpm install              # install all apps + packages
docker compose up -d      # local Postgres + Redis + MinIO
pnpm dev                  # run everything in dev mode
```

> New docs go in this folder; add a row to the table above so they're discoverable.
