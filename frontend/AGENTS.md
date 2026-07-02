# frontend/

React + Vite + TypeScript. Dashboard para loja Shopee.

## O que tem aqui
- `src/pages/` — 8 páginas (1 rota = 1 página)
- `src/hooks/use-data.ts` — todos os hooks de dados (TanStack Query)
- `src/components/` — layout + shadcn/ui
- `src/lib/` — Supabase client, API wrapper, utils
- `src/App.tsx` — entry point com rotas

## Para onde ir
| Quer mexer em... | Arquivo |
|---|---|
| Uma página específica | `src/pages/NomePagina.tsx` |
| Buscar/dados | `src/hooks/use-data.ts` |
| Layout/sidebar | `src/components/dashboard-layout.tsx` |
| Componentes UI | `src/components/ui/` (shadcn) |
| Cliente Supabase | `src/lib/supabase.ts` |
| Config build | `vite.config.ts`, `tsconfig.app.json` |

## Convenções
- Todas as rotas ficam sob `DashboardLayout` (App.tsx)
- Hooks usam `@tanstack/react-query` — nunca fetch direto
- Ícones: apenas `lucide-react`
- CSS: Tailwind v4, classes shadcn
- Números: `font-mono-nums`