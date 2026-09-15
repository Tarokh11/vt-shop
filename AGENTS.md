# Project Instructions

## Project
This repository implements a reusable single-store e-commerce starter platform.

Before planning or implementing features, read:

- docs/PROJECT_SCOPE.md
- docs/PLAN.md if it exists

## Architecture

- Backend: Django + Django REST Framework
- Frontend: Next.js + TypeScript
- Database: PostgreSQL
- Architecture: Modular Monolith
- API style: REST

## Development Rules

- Keep domains separated.
- Do not introduce business-specific features into the core unless required.
- Prefer simple implementations over premature abstractions.
- Do not add new dependencies without a clear reason.
- Do not redesign existing architecture unless necessary.
- Do not implement features outside PROJECT_SCOPE.md.

## Workflow

For substantial work:

1. Inspect the existing repository.
2. Read PROJECT_SCOPE.md.
3. Update or create docs/PLAN.md.
4. Implement one logical phase at a time.
5. Run relevant tests/checks.
6. Update PLAN.md with completed work and next steps.
7. Commit the completed phase after checks pass and documentation is updated.

Use one focused commit per completed phase. Do not combine unfinished work with a
phase commit, and do not amend or rewrite existing commits unless explicitly requested.

If an architectural decision is unclear, document the assumption before implementation.
