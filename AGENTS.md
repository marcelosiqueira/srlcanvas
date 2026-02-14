# Codex Project Instructions

Use `docs/` as the primary source of truth for product and execution guidance.

## Documentation Order of Precedence

1. `docs/PRD.md` - product scope, requirements, and business rules.
2. `docs/workflows.md` - execution workflows and conditional processes.
3. `docs/output-patterns.md` - expected response/output format for implementation and reviews.
4. `docs/progressive-disclosure-patterns.md` - information architecture and UX/content layering.
5. `docs/SKILL.md` - operational guardrails for SRL Canvas development.

## Working Rules

- If code behavior changes, update relevant docs in `docs/` within the same change.
- If business rules conflict with implementation, follow `docs/PRD.md` and flag the mismatch.
- Keep responses concise, action-oriented, and include file references for any code/doc changes.
- Repository uses pnpm workspaces (`apps/web`, `apps/api`, `packages/*`).
- Run `pnpm check` for default validation when changing app behavior.
