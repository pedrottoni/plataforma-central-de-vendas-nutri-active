# frontend/src/

Código-fonte do React.

## Mapa
| Pasta/Arquivo | O que é |
|---|---|
| `App.tsx` | Entry point — rotas + providers |
| `pages/` | 8 páginas (1 por rota) |
| `hooks/use-data.ts` | 5 hooks TanStack Query |
| `components/dashboard-layout.tsx` | Sidebar + layout principal |
| `components/ui/` | Componentes shadcn/ui |
| `lib/supabase.ts` | Cliente Supabase |
| `lib/api.ts` | Fetch wrapper para FastAPI |
| `lib/utils.ts` | `cn()` helper |

## Hooks disponíveis
| Hook | Tabela | O que faz |
|---|---|---|
| `useUser()` | users | Busca usuário "Admin" |
| `useTasks()` | tasks | CRUD de tarefas |
| `useProducts()` | products + productvariations | Lista produtos com variações |
| `useTransactions()` | transactions | Transações financeiras |
| `useLowStockItems()` | inventoryitem | Itens com estoque < 10 |

## Status das páginas
- ✅ `Resumo.tsx`, `Financeiro.tsx`, `Anuncios.tsx`, `Tarefas.tsx` — dados reais
- 🔶 `Configuracoes.tsx` — parcial
- ❌ `Marketing.tsx`, `Atendimento.tsx`, `Concorrencia.tsx` — stubs