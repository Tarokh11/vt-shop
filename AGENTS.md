# Project Instructions

## Architecture

- Reusable single-store e-commerce starter.
- Django + DRF backend, Next.js + TypeScript frontend, PostgreSQL, REST.
- Modular monolith; use Django Admin for initial staff operations.

## Required Context

At session start, read `AGENTS.md`, `docs/SESSION_STATE.md`, and the relevant
active planning document. Read `docs/PROJECT_SCOPE.md` when scope decisions
matter. For catalog, product, inventory, search, filter, or stationery-store
work, read `docs/STATIONERY_CATALOG_PLAN.md` and use it as the implementation
reference.

## Engineering Rules

- Keep domains separate and changes minimal.
- Do not implement outside `PROJECT_SCOPE.md`.
- Prefer direct, simple solutions over premature abstractions or dependencies.
- Do not redesign architecture or refactor unrelated code without a concrete need.
- Update only the affected active-plan section; do not repeat existing documentation.

## Phase Workflow

1. Inspect relevant files and confirm the current plan.
2. Implement one logical phase at a time.
3. Run relevant tests, checks, and migrations.
4. Update the active plan, concise `docs/SESSION_STATE.md`, and
   `docs/IMPLEMENTATION_HISTORY.md` with the commit's completed steps/checks.
5. Review, stage, and commit the completed logical change.

Keep commits focused. Do not commit broken, incomplete, secret, generated, or
unrelated changes. Do not amend/rewrite commits unless explicitly requested.

## Implementation History

`docs/IMPLEMENTATION_HISTORY.md` is the durable record of completed work. Add
one concise entry for every implementation commit, including the commit ID,
completed steps, and verification. Do not turn `SESSION_STATE.md` into a log.

## Scope Changes

For a behavior, requirement, or boundary change: explain the issue, proposal,
and impact; wait for user approval; then update scope, plan, and session state.
Minor implementation details do not need scope approval.

## Efficiency

- Read and test only relevant files/components unless a full check is needed.
- Use targeted search and reuse existing conventions.
- Keep responses concise: changes, checks, blockers, next step.
- Avoid duplicate planning, broad scans, unrelated refactors, and alternative
  implementations without a real tradeoff.

## Session State

Keep `docs/SESSION_STATE.md` short: current phase, completed work, key decisions,
blockers, relevant files, checks, and next task. It is not a development log.

## Model Guidance

Use Luna for mechanical low-risk work, Terra for routine scoped implementation,
Sol for normal multi-file/domain work, and Astra only for unusually difficult
architecture, debugging, or risky refactors. Recommend a different model only
when it materially improves the task.

## merge branches

Keep reusable/core/main changes and store-specific changes in separate commits whenever possible. Do not mix them in the same commit unless necessary, so future merges and cherry-picks stay clean.
