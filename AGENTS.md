# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application written in TypeScript. Routes, layouts,
API handlers, and server actions live in `src/app/`; keep mutations in
`src/app/actions/`. Reusable UI belongs in `src/components/`, with generated
shadcn primitives in `src/components/ui/`. Shared server and domain utilities
are in `src/lib/`. Prisma schema, migrations, and seed data are in `prisma/`.
Unit tests sit beside library code under `src/lib/__tests__/`. Public static
files live in `public/`; VitePress documentation is in `docs/`.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies and runs Prisma client generation.
- `pnpm dev` starts the application on port 3000; `pnpm build` creates a
  production build and `pnpm start` serves it.
- `pnpm test` runs the Vitest suite once; use `pnpm test:watch` while editing.
- `pnpm typecheck` checks TypeScript without emitting files; `pnpm lint` runs
  the configured Next.js lint command.
- `pnpm db:push` synchronizes a local schema, `pnpm db:migrate` deploys checked-in
  migrations, and `pnpm db:seed` loads seed data. Copy `.env.example` to `.env`
  before database work; never commit secrets.
- `pnpm docs:dev` and `pnpm docs:build` serve and build the documentation site.

## Coding Style & Naming Conventions

Follow the existing TypeScript and React style: two-space indentation,
semicolon-terminated statements, and double-quoted imports. Components use
PascalCase filenames (for example, `RosterTable.tsx`); utilities use camelCase
(for example, `csvParser.ts`). Prefer the `@/src/...` import alias.

For database writes, use a Server Action with `"use server"`, authorize before
querying, use transactions for related writes, log activity, and revalidate
affected paths. Return `{ success, message }` for user-facing mutations. Store
attendance dates through `getUTCMidnight()` and scope teacher work to owned
sections or subjects.

## Testing Guidelines

Vitest runs Node-environment tests matching `src/**/*.test.ts`. Name tests
`*.test.ts`, group behavior with `describe`, and use focused assertions for
parsers, dates, schedules, and other deterministic logic. Run `pnpm test` and
`pnpm typecheck` before opening a pull request; add regression coverage for a
bug fix when practical.

## Commit & Pull Request Guidelines

Use concise Conventional Commit prefixes reflected in history: `feat:`, `fix:`,
`docs:`, and `chore:`. Keep each commit focused, such as
`fix: preserve subject search filter`. Pull requests should explain the user
impact, link the relevant issue when available, list validation performed, and
include screenshots for visible UI changes. Call out schema, migration, or
environment-variable changes explicitly.
