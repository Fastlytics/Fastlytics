# Fastlytics — Agent Notes

_Last reviewed: 2026-08-10. Layout, commands, and gotchas below were verified against the current tree._

## Workspace Shape

- **Root app**: React 19 SPA in `src/` with Vite 8, TypeScript 6, Tailwind CSS v4, shadcn/ui, React Router 7, TanStack Query, Supabase Auth, and Sentry.
- **Backend API**: Python/FastAPI app in `backend-api/` (FastF1, Supabase, Dodo Payments, local filesystem cache with optional R2 upload).
- **Active proxy worker**: Cloudflare Worker in `workers-v2 (new and updated)/`.
- **Archived worker**: `workers-old (deprecated)/` is legacy only — do not make new changes there.
- **Mobile app**: Expo (React Native) app in `mobile/` — Expo SDK 57, expo-router with file-based routes under `mobile/src/app/`, and a typed query-helper API layer in `mobile/src/api/`.
- **Shared package**: `@fastlytics/shared` in `packages/shared/` — raw TypeScript consumed via `main: src/index.ts` (no build step); shared between web and mobile.
- **MCP server**: standalone TypeScript MCP server in `mcp-server/` (stdio + HTTP/SSE transports) that proxies the worker API; no direct R2/Supabase access.
- **Docs site**: Mintlify docs in `docs/` (MDX pages, `docs.json` config; run `mint dev` to preview).
- **Other notable dirs**: `private-tests/` for frontend tests, `supabase/` for DB migrations/templates/functions, `openspec/` for specs, `reports/` for generated/reporting content, `testimonials/` for community post archives, `projects/` for vendored tooling (e.g. Fast-F1), `mobile-archive/` for deprecated legacy mobile web components (dead code).

The root is an npm workspace (`workspaces: ["packages/shared", "mobile"]` in `package.json`), so a root `npm install` covers the shared package and the mobile app.

Use this root file for cross-project orientation. For sub-project-specific work, also read:

- [backend-api/AGENTS.md](backend-api/AGENTS.md)
- [workers-v2 (new and updated)/AGENTS.md](<workers-v2 (new and updated)/AGENTS.md>)
- [mcp-server/AGENTS.md](mcp-server/AGENTS.md)
- [docs/AGENTS.md](docs/AGENTS.md)

## Root Frontend

- `npm run dev` starts Vite on **port 8080**.
- `npm run preview` / `npm run start` also bind **8080**.
- In dev, Vite proxies `/api` to `https://fastlytics-api-proxy-v2.subhashgottumukkala17.workers.dev`.
- `vite.config.ts` allows `dev.fastlytics.app` and `localhost` for dev, and `fastlytics.app` plus `dev.fastlytics.app` for preview.
- Tailwind v4 is configured in `src/index.css` via the `@tailwindcss/vite` plugin; there is **no live `tailwind.config.ts`** even though `components.json` still points at one.
- `vite.config.ts` also defines manual chunks for the production build (recharts, sentry, posthog, supabase, query, motion, radix, icons, router, react, etc.).

## Frontend Commands

| Command                             | Purpose                                |
| ----------------------------------- | -------------------------------------- |
| `npm run dev`                       | Vite dev server (port 8080)            |
| `npm run build`                     | Production build                       |
| `npm run build:dev`                 | Development-mode build                 |
| `npm run lint` / `npm run lint:fix` | ESLint                                 |
| `npm run format`                    | Prettier (`--write` on everything)     |
| `npm run test`                      | Vitest watch                           |
| `npm run test:watch`                | Explicit watch mode                    |
| `npm run test:coverage`             | One-shot coverage run                  |
| `npm run test:ci`                   | CI-style coverage run                  |
| `npm run preview` / `npm run start` | Preview build (port 8080)              |
| `npm run knip`                      | Unused code/dependency scan            |
| `npm run doctor`                    | `react-doctor` dependency/health check |

There is **no `typecheck` script** — run `npx tsc --noEmit` to typecheck.

Pre-commit hooks run `eslint --fix` and `prettier --write` through `lint-staged` (managed by `prepare: husky`).

## Frontend Env

Copy `.env.example` to `.env`.

Required for normal frontend work:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Common optional vars:

- `VITE_API_BASE_URL` defaults to `https://api.fastlytics.app` (the worker proxy)
- `VITE_FASTLYTICS_API_KEY` exists for direct/legacy backend calls, but normal frontend traffic should go through the worker proxy
- `VITE_UMAMI_WEBSITE_ID`
- `VITE_PUBLIC_POSTHOG_KEY`
- `VITE_PUBLIC_POSTHOG_HOST`

Dodo Payments keys (`DODO_PAYMENTS_*`) are configured in `backend-api/` only — not needed by the frontend.

## Frontend Architecture

- Routes live in `src/App.tsx` and are **lazy-loaded** (`lazy()` + `<Suspense fallback={<PageLoader />}>`), with Sentry (`Sentry.withSentryReactRouterV7Routing(Routes)`) wrapping routing.
- Layouts currently used are an inline `LandingLayout` in `src/App.tsx` and `DashboardLayout` in `src/components/layout/DashboardLayout.tsx`.
- Other layout/shared components: `Sidebar`, `LandingNavbar`, `MobileNav`, `CommandPalette`, `BreadcrumbBar`, `RouteTracker`, `ScrollToTop`, `PageLoader`, `SEO`.
- There is **no active `MainLayout`** even though older docs mention one.
- Route protection is split between public routes, `GatedRoute`, and `ProtectedRoute`; there's also `AppErrorBoundary` and a `ConsentBanner`.
- App-wide providers include `QueryClientProvider`, `TooltipProvider`, `SeasonProvider`, and `AuthProvider`.
- **Responsive mobile web pages**: many desktop pages (Dashboard, Race, TeamPaceAnalysis, ChampionshipProgression, Driver/Team profiles, CompareDrivers/Teams, Drivers, NewsDiscussion, SessionReplay, Saved, leaderboards, etc.) render `Mobile*` variants from `src/components/mobile/pages/` when `useIsMobile()` is true. The desktop body of each wired page lives in a `*Desktop` component (e.g. `DashboardDesktop`) so hook usage stays inside a single component. See `MOBILE_UI_RESTORE_HANDOFF.md` for the full wiring status.

## API Client Patterns

- Shared request helper: `src/lib/api-client.ts`
- Endpoint layer: `src/lib/api.ts`
- Base URL comes from `VITE_API_BASE_URL`.
- Auth tokens are attached in `api-client.ts` via Supabase access tokens.
- Some legacy direct fetch / direct URL construction still exists, especially in `src/lib/api.ts` and `src/components/replay/ReplayLoader.tsx`. Prefer extending the shared `request()` helper instead of adding more one-off fetches.

## Testing

- Frontend tests live under `private-tests/`, not `src/__tests__/`.
- Vitest uses `jsdom` and `private-tests/setupTests.ts`.
- Aliases:
  - `@` -> `src/`
  - `@test` -> `private-tests/`
- Coverage is limited to a curated file list in `vitest.config.ts`.
- Current thresholds: lines 40, functions 30, branches 25, statements 40.

## TypeScript and Linting

- Frontend TS is intentionally **non-strict** in `tsconfig.app.json`.
- `strictNullChecks`, `noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters` are off.
- ESLint ignores `dist`, `.agents`, `workers`, and `projects`.
- `@typescript-eslint/no-unused-vars` is disabled.
- Note: the Cloudflare worker (`workers-v2 (new and updated)/`) TS is **strict**, unlike the frontend.

## Boundaries

- Do not install backend Python dependencies at the repo root; use `backend-api/venv`.
- Do not add worker-only packages to the frontend root package; keep worker deps in `workers-v2 (new and updated)/package.json`.
- Keep mobile-only deps in `mobile/package.json`; shared logic that both web and mobile use belongs in `packages/shared/`.
- `mcp-server/` and `docs/` are independent of the frontend build.
- Use quoted paths in shell commands when working with `workers-v2 (new and updated)/` (spaces in the directory name).

## Current Gotchas

- Some older docs still mention `localhost:5173`; the real frontend dev port is **8080**.
- `components.json` still references `tailwind.config.ts`, but Tailwind v4 is CSS-configured in `src/index.css`.
- The frontend references `https://api.fastlytics.app`, but the checked-in worker config currently declares the custom domain `dev-api.fastlytics.app`; do not assume production worker routing is fully represented by the repo copy of `wrangler.toml`.
- Several sibling projects are gitignored (`docs/`, `mcp-server/`, `reports/`, `projects/`, `openspec/`, `skills/`) and won't show up in `git status`.
- The **root `AGENTS.md` is tracked** (removed from `.gitignore` 2026-08-10) — commit changes to it like any other doc.
- Sub-project `AGENTS.md` files (`backend-api/`, `workers-v2 (new and updated)/`, `mcp-server/`, `docs/`) remain untracked because their **whole directories are gitignored** — that's intentional, not a pattern you can override with a one-line un-ignore.
- `mobile-archive/` is dead code — the current mobile web UI lives in `src/components/mobile/` and the native app in `mobile/`.
- When wiring a desktop page to a `Mobile*` variant, extract the desktop body into a `*Desktop` component or `react-hooks/rules-of-hooks` will fail on the conditional `useIsMobile()` return.
