# ORIVIS V2 — Agent Instructions

## Context
We are building ORIVIS V2, a full UI redesign of the Orivis platform. V1 (at `ORIVIS V1/`) serves as reference for:
- **Content & context** — documentation, architecture, API contracts, types
- **Backend** — NestJS API at `ORIVIS V1/backend/` stays as-is
- **Design** — completely new, being built from scratch

V2 lives in `v2/` as a **Vite + React SPA**.

## Key References
- `ORIVIS V1/` — Full reference codebase (backend + old frontend)
- `ORIVIS V1/docs/` — Architecture, database schemas, implementation docs
- `ORIVIS V1/backend/` — NestJS API (unchanged, we consume it)
- `ORIVIS V1/frontend/src/types/` — TypeScript interfaces to mirror
- `ORIVIS V1/frontend/src/constants/api.ts` — API endpoint definitions
- `ORIVIS V1/frontend/src/constants/routes.ts` — Route definitions

## Development Workflow (from V1's 3-Layer Architecture)

**Layer 1 — Directives (`directives/`)**
SOPs in Markdown defining goals, inputs, outputs, edge cases.

**Layer 2 — Orchestration (this agent)**
Read directives, call tools in order, handle errors, self-anneal.

**Layer 3 — Execution**
Deterministic scripts when available. Prefer tools over manual work.

## Context Management
This project uses:
- `opencode.json` — auto-compaction at 20 tail turns
- `context-watch` MCP server — session tracking & checkpoints
- `context-management` skill — guidelines for long sessions

Use `save_checkpoint` at phase boundaries. Run `session_status` every ~15-20 messages.
