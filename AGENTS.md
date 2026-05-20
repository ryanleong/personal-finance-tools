<!-- BEGIN:nextjs-agent-rules -->

# Agent skills

## Issue tracker

Issues are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

## Triage labels

Uses canonical defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

## Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.



# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:architecture -->

# Architecture

## Layer separation rules

Every feature must separate logic from rendering across these four layers. Do not collapse layers.

### 1. `lib/` — pure domain logic

- No React imports. No side effects. No browser APIs.
- One file per responsibility (constraints, calculation, storage).
- Every function must be unit-testable with plain Node (no DOM).
- **Constraint functions**: if a feature has cross-field validation or clamping rules, extract them into a pure `applyXxxConstraints(current, update)` function here. Never put clamping inside `onChange` handlers.

### 2. `hooks/` — state and side effects

- Composed of focused sub-hooks. Each sub-hook owns exactly one concern:
  - **state hook** (`useXxxState`) — holds state, applies constraints, hydrates from storage on mount. Accepts optional `initialXxx` prop.
  - **sync hook** (`useXxxSync`) — debounced persistence side effect. Accepts state as param, returns nothing.
  - **orchestrating hook** (`useXxxData`) — composes sub-hooks, derives computed values via `useMemo`, exposes the public API. Accepts optional `initialXxx` and forwards it to the state hook.
- Derived values (e.g. calculation results) must use `useMemo`, never a separate `useState`.
- Public API of the orchestrating hook must be stable — consumers must not change when internals are refactored.

### 3. `components/` — rendering only

- Client root component is named `XxxClient.tsx` and marked `'use client'`.
- Accepts optional `initialXxx?: XxxInputs` prop for future SSR seeding.
- `onChange` handlers pass raw single-field updates — no clamping, no business logic.
- Sub-components (`InputPanel`, chart, status, warnings) are pure presentational: props in, JSX out.

### 4. `page.tsx` — Server Component shell

- No `'use client'` directive.
- Owns `export const metadata`.
- Wraps the client root in `<Suspense fallback={<LoadingShell />}>`.
- Passes no props to the client root in the MVP; `initialXxx` is reserved for future async RSC data-fetching.

## File naming conventions

| Purpose                    | Pattern                    | Example                                     |
| -------------------------- | -------------------------- | ------------------------------------------- |
| Domain types and constants | `types.ts`                 | `types.ts`                                  |
| Pure constraint function   | `lib/constraints.ts`       | `lib/constraints.ts`                        |
| Pure calculation function  | `lib/calculator.ts`        | `lib/calculator.ts`                         |
| Storage adapter            | `lib/storage.ts`           | `lib/storage.ts`                            |
| State + hydration hook     | `hooks/useXxxState.ts`     | `hooks/useInputState.ts`                    |
| Side-effect sync hook      | `hooks/useXxxSync.ts`      | `hooks/useStorageSync.ts`                   |
| Orchestrating hook         | `hooks/useXxxData.ts`      | `hooks/useRetirementData.ts`                |
| Client root component      | `components/XxxClient.tsx` | `components/RetirementCalculatorClient.tsx` |
| Route entry point          | `page.tsx`                 | `page.tsx`                                  |

## Testing rules

- Test runner: **Vitest** with `environment: 'jsdom'` globally (`vitest.config.ts` at root).
- Run all tests: `npx vitest run`
- `lib/` tests use pure Node assertions — no React, no DOM APIs needed.
- `hooks/` tests use `renderHook` + `act` from `@testing-library/react`.
- Mock storage in hook tests: `vi.mock('../lib/storage', () => ({ loadInputs: vi.fn(), saveInputs: vi.fn() }))`.
- Use `vi.useFakeTimers()` to test debounce behaviour.
- Test files live alongside the file under test (`foo.test.ts` next to `foo.ts`).
- Tests must describe **observable behaviour**, not implementation details. Tests must survive internal refactors.

## TDD workflow for new features

1. Create `lib/constraints.ts` with `applyXxxConstraints` → write unit tests first.
2. Create `lib/calculator.ts` (if feature has computation) → write unit tests first.
3. Create `hooks/useXxxState.ts` + `hooks/useXxxSync.ts` → write hook tests.
4. Create `hooks/useXxxData.ts` composing the sub-hooks → write integration tests.
5. Create `components/XxxClient.tsx` → update `page.tsx` with Suspense shell.
6. Strip any business logic that crept into component `onChange` handlers.
<!-- END:architecture -->
