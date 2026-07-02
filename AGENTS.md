# Plataforma Central — Shopee Growth Quest

React + Vite + TypeScript dashboard for a Shopee health/supplements store. Monolithic frontend with page-per-tab architecture.

**Stack:** React 19 + Vite + TypeScript + shadcn/ui + React Router + TanStack Query + Supabase + Recharts
**Backend:** FastAPI (Python) — stub routers, AI/scraper logic to be implemented later

## Quick Nav

> **Mapa completo com wikilinks**: Ver nota do Obsidian `Plataforma Central` em `C:\Proiectum\Vacuum\Notae\Plataforma Central.md`

| Precisa de... | Ir para... |
|--------|-------------|
| Produtos/Anúncios | `frontend/src/pages/Anuncios.tsx` + `hooks/use-data.ts` (useProducts) |
| Financeiro | `frontend/src/pages/Financeiro.tsx` + `hooks/use-data.ts` (useTransactions) |
| Resumo/KPIs | `frontend/src/pages/Resumo.tsx` + todos os hooks |
| Tarefas | `frontend/src/pages/Tarefas.tsx` + `hooks/use-data.ts` (useTasks) |
| Backend/API | `backend/routers/` — todos stubs, `backend/main.py` para registrar |
| Banco de dados | `supabase/migrations/001_initial_schema.sql` |
| Marketing | `frontend/src/pages/Marketing.tsx` — stub |
| Atendimento | `frontend/src/pages/Atendimento.tsx` — stub |
| Concorrência | `frontend/src/pages/Concorrencia.tsx` — stub |
| **Shopee Integração** | `references/shopee-integration.md` — riscos, guidelines, endpoints |
| **Task Tracking** | `KANBAN.md` — status das tarefas |

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
| `backend/.env` | Credenciais Shopee (NUNCA commitar — já no .gitignore) |
| `supabase/migrations/` | SQL schema (9 tables converted from SQLModel) |
| `references/shopee-integration.md` | Riscos, guidelines, endpoints da API Shopee |
| `KANBAN.md` | Task tracking do projeto |

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