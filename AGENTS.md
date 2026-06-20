# Plataforma Central — Shopee Growth Quest

React + Vite + TypeScript dashboard for a Shopee health/supplements store. Monolithic frontend with page-per-tab architecture.

**Stack:** React 18 + Vite + TypeScript + shadcn/ui + React Router + TanStack Query + Supabase + Recharts
**Backend:** FastAPI (Python) — stub routers, AI/scraper logic to be implemented later

## Directory Map

| Module | What matters |
|--------|-------------|
| `frontend/src/App.tsx` | **Entry point.** React Router routes, QueryClient provider |
| `frontend/src/pages/` | 8 pages — Resumo/Tarefas/Financeiro/Anuncios com dados reais do Supabase; Marketing/Atendimento/Concorrencia são stubs |
| `frontend/src/hooks/use-data.ts` | TanStack Query hooks: useUser, useTasks, useProducts, useTransactions, useLowStockItems |
| `frontend/src/components/` | `dashboard-layout.tsx` (sidebar + main), `ui/` (shadcn components) |
| `frontend/src/lib/` | `supabase.ts` (client), `api.ts` (FastAPI fetch wrapper), `utils.ts` (cn helper) |
| `frontend/components.json` | shadcn/ui config — `new-york` style, `lucide` icons |
| `backend/main.py` | FastAPI app with CORS, 5 routers, health check |
| `backend/routers/` | Stub routers: products, finances, competitors, agents, tasks — all return `{"status": "em breve"}` |
| `supabase/migrations/` | SQL schema (9 tables converted from SQLModel) |

## Run

```bash
# Frontend
cd frontend && npm run dev

# Backend (from project root)
cd backend && uvicorn main:app --reload

# Build
cd frontend && npm run build
```

## Key Conventions

- **Path alias:** `@/` maps to `src/` (configured in `vite.config.ts` + `tsconfig.app.json`)
- **UI components:** shadcn/ui `new-york` style, located in `src/components/ui/`
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin
- **Icons:** `lucide-react` — no Material Symbols (different from ADM project)
- **State:** TanStack Query for server state, React state for local UI
- **Routing:** React Router v7 — all routes nested under `DashboardLayout`

## Pages → Tabs

| Route | Page | Replaces Streamlit tab |
|-------|------|----------------------|
| `/resumo` | Resumo | KPIs, alerts |
| `/financeiro` | Financeiro | Treasury, sales, expenses (has sub-tabs) |
| `/marketing` | Marketing | Campaign analysis, AI prompts |
| `/atendimento` | Atendimento | AI response generator |
| `/anuncios` | Anuncios | Product CRUD, kits, CSV (has sub-tabs) |
| `/concorrencia` | Concorrencia | Price monitor |
| `/tarefas` | Tarefas | Ops tasks |
| `/configuracoes` | Configuracoes | LLM provider config |

## Backend API (stub)

All endpoints return `{"status": "em breve"}`. Implement when ready:
- `POST /api/agents/*` — LLM operations (product generation, finance analysis, etc.)
- `POST /api/competitors/*` — Scraping + AI matching
- `GET/POST /api/products/*` — Product CRUD (direct to Supabase)
- `GET/POST /api/tasks/*` — Task engine
- `GET /api/finances/*` — Financial stats

## Supabase

- Schema: `supabase/migrations/001_initial_schema.sql`
- 9 tables: users, missions, products, productvariations, inventoryitem, productcomponent, transactions, competitorlistings, tasks
- Paste SQL into Supabase SQL Editor to create tables
- Frontend reads `.env` vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Project Status

| ID | Status | What |
|----|--------|------|
| T1 | ✅ | Fundação — React+Vite, Supabase, FastAPI |
| T2 | ✅ | Layout, sidebar, routing, 8 páginas |
| T3 | ✅ | Dados reais do Supabase — hooks + páginas conectadas |
| T4 | ✅ | Financeiro — receita/despesa/lucro, listas de transações |
| T5 | ✅ | Anúncios — lista produtos, barras de estoque, badges |
| T6 | ✅ | Concorrência — stub (precisa backend scraping) |
| T7 | ✅ | Marketing + Atendimento — stubs (precisa backend AI) |
| T8 | ✅ | Polish — theme shadcn, loading, responsivo |

## Pending (needs backend)

- **Concorrência**: price monitor com scrapers — `backend/routers/competitors.py` + `competitor_service.py`
- **Marketing**: geração de prompts Midjourney — `backend/routers/agents.py`
- **Atendimento**: AI response generator + sentiment — `backend/routers/agents.py`
- **Upload CSV**: parse de planilha Seller Center — `backend/routers/finances.py`
- **CRUD completo**: criar/editar/deletar produtos via UI — `backend/routers/products.py`
- **Task engine**: auto-gerar tarefas baseadas no estado — `backend/routers/tasks.py`
