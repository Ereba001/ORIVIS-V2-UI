# ORIVIS V2 — Agent Instructions

## Context
We are building ORIVIS V2, a full UI redesign of the Orivis platform. It is a **Vite + React SPA** living in `ORIVIS-V2-UI/`, consuming a Laravel backend in `../backend/`.

## Session checkpoints (mandatory)
- Save a checkpoint after every phase (see root `AGENTS.md`); persist a phase-status note into `docs/` with today's date when the `save_checkpoint` MCP tool is unavailable.
- Record: what was done, exact verification results, files changed, next item to continue from.

## Audit constraints (binding)
- No hardcoded currency/prices in the frontend — always display API-returned currency via `src/lib/currency.ts` (`formatMoney`/`formatMoneyFromMinor`).
- NGN default billing currency; USD only as explicit optional.
- No mock/fake data in production; no silent `catch { return [] }` — errors must surface.
- Do not reintroduce monthly-subscription assumptions if the model is per-election billing.
- Do not weaken RBAC / row-level security / org isolation on the frontend either.

## UI style rules (binding)
- No emojis as icons — use lucide-react icon components (or plain CSS/typography), never emoji glyphs in place of icons.
- No hyphens in user-facing copy (labels, headings, paragraphs, tooltips, placeholders): write compounds as separate words ("decision making", "per event", "two factor"). Hyphens remain allowed in code identifiers, Tailwind classes, routes, filenames, and proper nouns.

## Key References
- `../backend/` — Laravel API (Served at `http://localhost:8000/api/v1`)
- `../backend/docs/` — Backend architecture and phase summaries
- `../backend/routes/api.php` → `api_v1.php` — API route definitions
- `src/constants/api.ts` — API endpoint definitions
- `src/constants/routes.ts` — Route definitions

## Development Workflow

**Layer 1 — Directives (`directives/`)**
SOPs in Markdown defining goals, inputs, outputs, edge cases.

**Layer 2 — Orchestration (this agent)**
Read directives, call tools in order, handle errors, self-anneal.

**Layer 3 — Execution**
Deterministic scripts when available. Prefer tools over manual work.

## Skills (mandatory)

Before starting any task, check the installed skill libraries and load the matching skill (via the `skill` tool) when the task matches its description:

1. **Design/UI/GSAP/Content skills** in `~/.agents/skills/` and `~/.claude/skills/` — see the root `AGENTS.md` for the list.
2. **Borghei Claude-Skills library** — 369 skills installed at `~/.config/opencode/skills/borghei-claude-skills/` (engineering, project-management, marketing, compliance, legal, product, business, research, data, finance, and more). All descriptions are advertised in the system prompt; browse `docs/SKILLS.md` there if no obvious match. Never improvise a workflow the library already specifies.

## Context Management
This project uses:
- `opencode.json` — auto-compaction at 20 tail turns
- `context-watch` MCP server — session tracking & checkpoints
- `context-management` skill — guidelines for long sessions

Use `save_checkpoint` at phase boundaries. Run `session_status` every ~15-20 messages.
