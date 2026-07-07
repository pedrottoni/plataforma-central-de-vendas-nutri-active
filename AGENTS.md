# Plataforma Central — Nutri Active

Dashboard for a Shopee supplements store. Monolithic frontend with page-per-tab architecture.

**Stack:** React 19 + Vite + TypeScript + shadcn/ui + React Router v7 + TanStack Query + Supabase + Recharts
**Backend:** FastAPI (Python) — stub routers, AI/scraper logic to be implemented later

## Quick Start

```bash
# Both services at once (Windows)
start.bat

# Or manually:
cd frontend && npm run dev      # http://localhost:5173
cd backend && uvicorn main:app --reload --port 8000  # http://localhost:8000/docs
```

## Environment Setup

Copy `.env.example` to `.env` in both `frontend/` and `backend/`.

Frontend needs:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from Supabase project settings
- `VITE_API_URL` — defaults to `http://localhost:8000`

Backend `.env` is optional (AI keys for future use).

## Build & Verify

```bash
cd frontend
npm run build    # runs `tsc -b && vite build` (typecheck THEN bundle)
npm run lint     # eslint
```

**TypeScript strictness:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` are enabled. Unused imports will fail the build.

## Quick Nav

| Need... | Go to... |
|--------|---------|
| Products/Listings | `frontend/src/pages/Anuncios.tsx` + `hooks/use-data.ts` (useProducts) |
| Financial | `frontend/src/pages/Financeiro.tsx` + `hooks/use-data.ts` (useTransactions) |
| Dashboard/KPIs | `frontend/src/pages/Resumo.tsx` + all hooks |
| Tasks | `frontend/src/pages/Tarefas.tsx` + `hooks/use-data.ts` (useTasks) |
| Backend/API | `backend/routers/` — all stubs, `backend/main.py` to register |
| Database | `supabase/migrations/001_initial_schema.sql` |
| Marketing | `frontend/src/pages/Marketing.tsx` — stub |
| Support | `frontend/src/pages/Atendimento.tsx` — stub |
| Competitors | `frontend/src/pages/Concorrencia.tsx` — stub |
| Task tracking | `KANBAN.md` |

## Directory Map

| Module | What matters |
|--------|-------------|
| `frontend/src/App.tsx` | **Entry point.** React Router routes, QueryClient provider |
| `frontend/src/pages/` | 8 pages — Resumo/Tarefas/Financeiro/Anuncios have real Supabase data; Marketing/Atendimento/Concorrencia are stubs |
| `frontend/src/hooks/use-data.ts` | TanStack Query hooks: useUser, useTasks, useProducts, useTransactions, useLowStockItems |
| `frontend/src/components/` | `dashboard-layout.tsx` (sidebar + main), `ui/` (shadcn components) |
| `frontend/src/lib/` | `supabase.ts` (client), `api.ts` (FastAPI fetch wrapper), `utils.ts` (cn helper) |
| `frontend/components.json` | shadcn/ui config — `new-york` style, `lucide` icons, `zinc` base color |
| `backend/main.py` | FastAPI app with CORS (localhost:5173 only), 5 routers, health check |
| `backend/routers/` | Stub routers: products, finances, competitors, agents, tasks — all return `{"status": "em breve"}` |
| `supabase/migrations/` | SQL schema (9 tables) |
| `supabase/seed.sql` | Default admin user |

Sub-directory AGENTS.md files exist in `frontend/`, `backend/`, `supabase/`, and `frontend/src/` with more detail on each module.

## Key Conventions

- **Path alias:** `@/` maps to `src/` (configured in `vite.config.ts` + `tsconfig.app.json`)
- **UI components:** shadcn/ui `new-york` style, located in `src/components/ui/`
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin
- **Icons:** `lucide-react` only — no Material Symbols
- **State:** TanStack Query for server state, React state for local UI
- **Routing:** React Router v7 — all routes nested under `DashboardLayout`

## Gotchas

- **`.gitignore` blocks `*.sql`** — data dumps like `insert_vendas.sql` won't be committed. This is intentional (production data).
- **Supabase migrations are manual** — paste SQL into Supabase SQL Editor. There is no CLI migration pipeline.
- **CORS is locked to `localhost:5173`** — backend will reject requests from other origins.
- **Backend routers are all stubs** — they return `{"status": "em breve"}`. The frontend talks to Supabase directly via the JS client, not through the backend.
