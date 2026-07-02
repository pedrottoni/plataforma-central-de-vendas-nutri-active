# supabase/

Schema SQL e migrations.

## Arquivo principal
`migrations/001_initial_schema.sql` — 9 tabelas

## Tabelas
| Tabela | Relação com frontend |
|---|---|
| `users` | `useUser()` |
| `products` | `useProducts()` |
| `productvariations` | `useProducts()` |
| `inventoryitem` | `useLowStockItems()` |
| `transactions` | `useTransactions()` |
| `tasks` | `useTasks()` |
| `missions` | não usada |
| `productcomponent` | não usada |
| `competitorlistings` | não usada |

## Como aplicar
Colar SQL no Supabase SQL Editor → não há CLI de migrations automático.

## Cuidados
- INSERT máximo 5 rows/batch (timeout 60s)
- Usar `execute_sql` para DML, `apply_migration` para DDL
- RLS não configurado — usar anon key com cautela