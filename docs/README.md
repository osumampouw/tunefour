# Tunefour Docs

Documentation index for the Tunefour digital signage platform.

## Contents

| Doc | What it covers |
| --- | --- |
| [Tech Stack Guide](./tech-stack.html) | Friendly tour of every technology in the stack (TypeScript, pnpm, Turborepo, React, Next.js, NestJS, Electron, Docker, Terraform) for someone new to it — with "coming from X" bridges, examples, and links to tutorials. **Open in a browser:** `open docs/tech-stack.html` |
| [ORM / Migration Comparison](./orm-comparison.html) | Decision doc comparing Prisma vs Drizzle vs TypeORM for the NestJS + Postgres server, with a recommendation (Prisma). **Open in a browser:** `open docs/orm-comparison.html` |
| [Implementation Plan](../IMPLEMENTATION_PLAN.md) | The full architecture, data model, phased build plan (MVP = Phases 0–7), fail-safe & security design, and per-phase Claude model/effort guidance (§11). |
| [CLAUDE.md](../CLAUDE.md) | Project guardrails and conventions for Claude Code (the two hard requirements, stack, repo layout, Windows 11 Pro notes). |

## Suggested reading order

1. **New to the stack?** Start with the [Tech Stack Guide](./tech-stack.html) — it includes a
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
